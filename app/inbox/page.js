"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Star, Eye, CornerUpLeft, Clock3, Trash2, BellOff, Mail, MailOpen,
  Search, PencilLine, Sparkles, ListChecks, Check,
} from "lucide-react";
import Shell from "../components/Shell";

export default function InboxPage() {
  const { status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewingEmail, setViewingEmail] = useState(null);
  const [emailBody, setEmailBody] = useState({ content: "", isHtml: false });
  const [bodyLoading, setBodyLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePriority, setActivePriority] = useState("All");
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/emails")
        .then((res) => res.json())
        .then((data) => {
          setEmails(data.emails || []);
          setNextPageToken(data.nextPageToken || null);
          setLoading(false);
        });
    }
  }, [status]);

  const handleLoadMore = async () => {
    if (!nextPageToken) return;
    setLoadingMore(true);
    const res = await fetch(`/api/emails?pageToken=${nextPageToken}`);
    const data = await res.json();
    setEmails(data.emails || []);
    setNextPageToken(data.nextPageToken || null);
    setLoadingMore(false);
  };

  const handleDelete = (id) => {
    setEmails((prev) => prev.filter((e) => e.gmail_id !== id));
    fetch(`/api/emails/${id}`, { method: "DELETE" });
    showToast("Email deleted");
  };

  const handleStar = (email) => {
    setEmails((prev) =>
      prev.map((e) => (e.gmail_id === email.gmail_id ? { ...e, is_starred: !e.is_starred } : e))
    );
    fetch(`/api/emails/${email.gmail_id}/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: email.is_starred ? "unstar" : "star" }),
    });
  };

  const handleToggleRead = (email) => {
    setEmails((prev) =>
      prev.map((e) => (e.gmail_id === email.gmail_id ? { ...e, is_unread: !e.is_unread } : e))
    );
    fetch(`/api/emails/${email.gmail_id}/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: email.is_unread ? "read" : "unread" }),
    });
  };

  const handleUnsubscribe = (email) => {
    const nowUnsub = !email.unsubscribed;
    setEmails((prev) =>
      prev.map((e) => (e.gmail_id === email.gmail_id ? { ...e, unsubscribed: nowUnsub } : e))
    );
    showToast(nowUnsub ? "Unsubscribed!" : "Resubscribed");
    if (nowUnsub) {
      fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: email.unsubscribe_link }),
      });
    }
  };

  const handleSnooze = (email) => {
    setEmails((prev) => prev.filter((e) => e.gmail_id !== email.gmail_id));
    fetch(`/api/emails/${email.gmail_id}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: 24 }),
    });
    showToast("Snoozed for 24 hours");
  };

  const handleReply = async (email) => {
    setReplyingTo(email);
    setReplyText("");
    setReplyLoading(true);
    const res = await fetch(`/api/emails/${email.gmail_id}/reply`);
    const data = await res.json();
    setReplyText(data.suggestion || "");
    setReplyLoading(false);
  };

  const handleSend = async () => {
    setSending(true);
    const res = await fetch(`/api/emails/${replyingTo.gmail_id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyText }),
    });
    setSending(false);
    if (res.ok) {
      setReplyingTo(null);
      setReplyText("");
      showToast("Reply sent!");
    } else {
      showToast("Failed to send reply");
    }
  };

  const handleView = async (email) => {
    setViewingEmail(email);
    setEmailBody({ content: "", isHtml: false });
    setBodyLoading(true);

    if (email.is_unread) {
      setEmails((prev) =>
        prev.map((e) => (e.gmail_id === email.gmail_id ? { ...e, is_unread: false } : e))
      );
      fetch(`/api/emails/${email.gmail_id}/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      });
    }

    const res = await fetch(`/api/emails/${email.gmail_id}/content`);
    const data = await res.json();
    setEmailBody({ content: data.body || "Could not load email.", isHtml: data.isHtml });
    setBodyLoading(false);
  };

  const handleCompose = async () => {
    setComposeSending(true);
    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody }),
    });
    setComposeSending(false);
    if (res.ok) {
      setComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      showToast("Email sent!");
    } else {
      showToast("Failed to send email");
    }
  };

  const priorityPill = (p) => {
    if (p === "High") return "bg-red-500/15 text-red-500";
    if (p === "Medium") return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400";
    return "bg-green-500/15 text-green-600 dark:text-green-400";
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date)) return "";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const categories = ["All", "Work", "Personal", "Promotions", "Social", "Updates"];
  const priorities = ["All", "High", "Medium", "Low"];

  const filteredEmails = emails.filter((email) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      email.subject?.toLowerCase().includes(s) ||
      email.from_address?.toLowerCase().includes(s) ||
      email.snippet?.toLowerCase().includes(s);
    const matchesCategory = activeCategory === "All" || email.category === activeCategory;
    const matchesPriority = activePriority === "All" || (email.priority || "Medium") === activePriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const iconBtn = "w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-content hover:bg-card2 transition";

  const composeButton = (
    <button
      onClick={() => setComposing(true)}
      className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent2 text-accent-text px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
    >
      <PencilLine size={16} /> Compose
    </button>
  );

  if (status === "loading" || loading)
    return (
      <Shell title="Inbox" actions={composeButton}>
        <p className="text-muted">Loading your emails...</p>
      </Shell>
    );

  return (
    <Shell title="Inbox" actions={composeButton}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-card border border-line rounded-xl px-4 py-3 flex items-center gap-2 text-sm shadow-lg">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-text flex items-center justify-center">
            <Check size={13} />
          </span>
          {toast}
        </div>
      )}

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          name="inbox-search"
          autoComplete="off"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-line rounded-xl py-3 pl-10 pr-3 text-content placeholder:text-muted focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-muted mr-1">Priority</span>
        {priorities.map((p) => (
          <button
            key={p}
            onClick={() => setActivePriority(p)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              activePriority === p
                ? "bg-gradient-to-r from-accent to-accent2 text-accent-text"
                : "bg-card border border-line text-muted hover:text-content"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs text-muted mr-1">Category</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              activeCategory === cat
                ? "bg-gradient-to-r from-accent to-accent2 text-accent-text"
                : "bg-card border border-line text-muted hover:text-content"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {composing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-line rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">New Email</h2>
            <input type="email" placeholder="To" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className="w-full bg-card2 border border-line rounded-lg p-3 mb-3 focus:outline-none focus:border-accent" />
            <input type="text" placeholder="Subject" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} className="w-full bg-card2 border border-line rounded-lg p-3 mb-3 focus:outline-none focus:border-accent" />
            <textarea placeholder="Write your message..." value={composeBody} onChange={(e) => setComposeBody(e.target.value)} className="w-full bg-card2 border border-line rounded-lg p-3 mb-4 h-40 resize-none focus:outline-none focus:border-accent" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setComposing(false)} className="px-4 py-2 rounded-lg border border-line hover:bg-card2">Cancel</button>
              <button onClick={handleCompose} disabled={composeSending} className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-accent2 text-accent-text font-medium disabled:opacity-50">{composeSending ? "Sending..." : "Send"}</button>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex gap-3 justify-end">
              <button onClick={() => { handleReply(viewingEmail); setViewingEmail(null); }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-accent2 text-accent-text font-medium">Reply</button>
              <button onClick={() => setViewingEmail(null)} className="px-4 py-2 rounded-lg border border-line hover:bg-card2">Close</button>
            </div>
          </div>
        </div>
      )}

      {replyingTo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-line rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-1">Reply to {replyingTo.from_address}</h2>
            <p className="text-sm text-muted mb-4">Re: {replyingTo.subject}</p>
            {replyLoading ? (
              <p className="text-accent-soft mb-4">Generating AI reply...</p>
            ) : (
              <textarea className="w-full bg-card2 border border-line rounded-lg p-3 mb-4 h-40 resize-none focus:outline-none focus:border-accent" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setReplyingTo(null)} className="px-4 py-2 rounded-lg border border-line hover:bg-card2">Cancel</button>
              <button onClick={handleSend} disabled={sending || replyLoading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-accent2 text-accent-text font-medium disabled:opacity-50">{sending ? "Sending..." : "Send"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filteredEmails.map((email) => (
          <div
            key={email.gmail_id}
            className={`group bg-card border border-line rounded-xl p-4 transition-all hover:border-accent hover:shadow-lg hover:shadow-accent/10 ${email.is_unread ? "border-l-4 border-l-accent" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-text flex items-center justify-center text-sm font-semibold shrink-0">
                {(email.from_address || "?").trim().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityPill(email.priority)}`}>{email.priority || "Medium"}</span>
                    <span className="text-xs text-muted">{email.category || "Updates"}</span>
                    {email.received_at && (
                      <span className="text-xs text-muted">· {formatDate(email.received_at)}</span>
                    )}
                    {email.deadline && email.deadline !== "none" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 flex items-center gap-1"><Clock3 size={12} /> {email.deadline}</span>
                    )}
                    {email.unsubscribed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-soft">Unsubscribed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => handleStar(email)} className={iconBtn} title="Star"><Star size={17} className={email.is_starred ? "fill-yellow-400 text-yellow-400" : ""} /></button>
                    <button onClick={() => handleToggleRead(email)} className={iconBtn} title={email.is_unread ? "Mark read" : "Mark unread"}>{email.is_unread ? <Mail size={17} /> : <MailOpen size={17} />}</button>
                    <button onClick={() => handleView(email)} className={iconBtn} title="View"><Eye size={17} /></button>
                    <button onClick={() => handleReply(email)} className={iconBtn} title="Reply"><CornerUpLeft size={17} /></button>
                    <button onClick={() => handleSnooze(email)} className={iconBtn} title="Snooze 24h"><Clock3 size={17} /></button>
                    <button onClick={() => handleDelete(email.gmail_id)} className={iconBtn} title="Delete"><Trash2 size={17} /></button>
                    {email.unsubscribe_link && (
                      <button onClick={() => handleUnsubscribe(email)} className={iconBtn} title={email.unsubscribed ? "Unsubscribed (click to undo)" : "Unsubscribe"}>
                        <BellOff size={17} className={email.unsubscribed ? "text-accent-soft" : ""} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted truncate">{email.from_address}</p>
                <p className="mt-1 flex items-start gap-1.5 font-medium text-accent-soft"><Sparkles size={16} className="mt-0.5 shrink-0" /> {email.summary}</p>
                {email.actionItems && email.actionItems.length > 0 && (
                  <div className="mt-3 bg-card2 rounded-lg p-3">
                    <p className="text-xs font-semibold text-accent-soft mb-1 flex items-center gap-1.5"><ListChecks size={14} /> Action Items</p>
                    <ul className="list-disc list-inside text-sm text-content/90">
                      {email.actionItems.map((item, i) => (<li key={i}>{item}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <button onClick={handleLoadMore} disabled={loadingMore} className="bg-card border border-line px-6 py-3 rounded-lg hover:bg-card2 disabled:opacity-50 transition">
            {loadingMore ? "Loading..." : "Load More Emails"}
          </button>
        </div>
      )}
    </Shell>
  );
}