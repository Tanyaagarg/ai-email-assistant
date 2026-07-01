"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, Sparkles, Eye, ArrowDownCircle, Trash2, Check } from "lucide-react";
import Shell from "../components/Shell";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingEmail, setViewingEmail] = useState(null);
  const [emailBody, setEmailBody] = useState({ content: "", isHtml: false });
  const [bodyLoading, setBodyLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [highlightId, setHighlightId] = useState(null);

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/priority-emails")
        .then((r) => r.json())
        .then((d) => {
          setEmails(d.emails || []);
          setLoading(false);
        });
    }
  }, [status]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("highlight");
    if (id) setHighlightId(id);
  }, []);

  useEffect(() => {
    if (highlightId && !loading) {
      const el = document.getElementById(`email-${highlightId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => setHighlightId(null), 1600);
      return () => clearTimeout(t);
    }
  }, [highlightId, loading]);

  const handleView = async (email) => {
    setViewingEmail(email);
    setEmailBody({ content: "", isHtml: false });
    setBodyLoading(true);
    const res = await fetch(`/api/emails/${email.gmail_id}/content`);
    const data = await res.json();
    setEmailBody({ content: data.body || "Could not load email.", isHtml: data.isHtml });
    setBodyLoading(false);
  };

  const handleDismiss = (email) => {
    setEmails((prev) => prev.filter((e) => e.gmail_id !== email.gmail_id));
    fetch(`/api/emails/${email.gmail_id}/priority`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: "Medium" }),
    });
    showToast("Removed from Do First");
  };

  const handleDelete = (email) => {
    setEmails((prev) => prev.filter((e) => e.gmail_id !== email.gmail_id));
    fetch(`/api/emails/${email.gmail_id}`, { method: "DELETE" });
    showToast("Email deleted");
  };

  const deadlineRank = (d) => {
    if (!d || d === "none") return 3;
    return isNaN(Date.parse(d)) ? 2 : 1;
  };

  const sortedEmails = [...emails].sort((a, b) => {
    const ra = deadlineRank(a.deadline);
    const rb = deadlineRank(b.deadline);
    if (ra !== rb) return ra - rb;
    if (ra === 1) return Date.parse(a.deadline) - Date.parse(b.deadline);
    return 0;
  });

  const iconBtn = "w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-content hover:bg-card2 transition";

  if (status === "loading" || loading)
    return (
      <Shell title="Do First">
        <p className="text-muted">Loading...</p>
      </Shell>
    );

  return (
    <Shell title="Do First">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-card border border-line rounded-xl px-4 py-3 flex items-center gap-2 text-sm shadow-lg">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-text flex items-center justify-center">
            <Check size={13} />
          </span>
          {toast}
        </div>
      )}

      <p className="text-muted mb-6">These emails need your attention first.</p>

      {viewingEmail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-line rounded-2xl p-6 w-full max-w-5xl h-[90vh] flex flex-col">
            <h2 className="text-lg font-semibold mb-1">{viewingEmail.subject}</h2>
            <p className="text-sm text-muted mb-4">From: {viewingEmail.from_address}</p>
            <div className="overflow-y-auto flex-1 rounded-lg mb-4 bg-white">
              {bodyLoading ? (
                <p className="text-accent-soft p-4">Loading email...</p>
              ) : emailBody.isHtml ? (
                <iframe srcDoc={emailBody.content} className="w-full h-full rounded-lg border-0 bg-white" sandbox="allow-same-origin" title="Email content" />
              ) : (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-4 rounded-lg h-full">{emailBody.content}</pre>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewingEmail(null)} className="px-4 py-2 rounded-lg border border-line hover:bg-card2">Close</button>
            </div>
          </div>
        </div>
      )}

      {sortedEmails.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-8 text-center text-muted">
          No high priority emails right now. You&apos;re all caught up! 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedEmails.map((email) => (
            <div
              key={email.gmail_id}
              id={`email-${email.gmail_id}`}
              className={`bg-card border border-line border-l-4 border-l-red-500 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-red-500/10 ${highlightId === email.gmail_id ? "ring-2 ring-accent shadow-lg shadow-accent/30" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-text flex items-center justify-center text-sm font-semibold shrink-0">
                  {(email.from_address || "?").trim().charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/15 text-red-500 flex items-center gap-1">
                        <AlertTriangle size={12} /> High
                      </span>
                      {email.deadline && email.deadline !== "none" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 flex items-center gap-1">
                          <Clock3 size={12} /> {email.deadline}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => handleView(email)} className={iconBtn} title="View"><Eye size={17} /></button>
                      <button onClick={() => handleDismiss(email)} className={iconBtn} title="Not important (remove from Do First)"><ArrowDownCircle size={17} /></button>
                      <button onClick={() => handleDelete(email)} className={iconBtn} title="Delete"><Trash2 size={17} /></button>
                    </div>
                  </div>
                  <p className="text-sm text-muted truncate">{email.from_address}</p>
                  <p className="mt-1 flex items-start gap-1.5 font-medium text-accent-soft">
                    <Sparkles size={16} className="mt-0.5 shrink-0" /> {email.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}