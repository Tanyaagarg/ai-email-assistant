"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InboxPage() {
  const { data: session, status } = useSession();
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/emails")
        .then((res) => res.json())
        .then((data) => {
          setEmails(data.emails || []);
          setLoading(false);
        });
    }
  }, [status]);

  const handleDelete = async (id) => {
    const res = await fetch(`/api/emails/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEmails(emails.filter((email) => email.gmail_id !== id));
    }
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
      alert("Reply sent!");
    } else {
      alert("Failed to send reply.");
    }
  };

  const handleView = async (email) => {
    setViewingEmail(email);
    setEmailBody({ content: "", isHtml: false });
    setBodyLoading(true);
    const res = await fetch(`/api/emails/${email.gmail_id}/content`);
    const data = await res.json();
    setEmailBody({
      content: data.body || "Could not load email.",
      isHtml: data.isHtml,
    });
    setBodyLoading(false);
  };

  if (status === "loading" || loading)
    return <div className="p-8">Loading your emails...</div>;

  const priorityColor = (priority) => {
    if (priority === "High") return "bg-red-500";
    if (priority === "Medium") return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Inbox</h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Do First 🔥
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Sign out
          </button>
        </div>
      </div>
      <p className="mb-4">Welcome, {session?.user?.name}!</p>

      {viewingEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-bold mb-1">{viewingEmail.subject}</h2>
            <p className="text-sm text-gray-400 mb-4">
              From: {viewingEmail.from_address}
            </p>
            <div
              className="overflow-y-auto flex-1 rounded-lg mb-4"
              style={{ height: "400px" }}
            >
              {bodyLoading ? (
                <p className="text-blue-400">Loading email...</p>
              ) : emailBody.isHtml ? (
                <iframe
                  srcDoc={emailBody.content}
                  className="w-full h-full rounded-lg border-0"
                  sandbox="allow-same-origin"
                  title="Email content"
                />
              ) : (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-4 rounded-lg h-full">
                  {emailBody.content}
                </pre>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  handleReply(viewingEmail);
                  setViewingEmail(null);
                }}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 text-white"
              >
                Reply
              </button>
              <button
                onClick={() => setViewingEmail(null)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {replyingTo && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-1">
              Reply to {replyingTo.from_address}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Re: {replyingTo.subject}
            </p>
            {replyLoading ? (
              <p className="text-blue-400 mb-4">Generating AI reply...</p>
            ) : (
              <textarea
                className="w-full bg-gray-800 text-white p-3 rounded-lg mb-4 h-40 resize-none"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setReplyingTo(null)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || replyLoading}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {emails.map((email) => (
          <div
            key={email.gmail_id}
            className="border border-gray-700 p-4 mb-2 rounded"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs text-white px-2 py-0.5 rounded-full ${priorityColor(email.priority)}`}
                >
                  {email.priority || "Medium"}
                </span>
                {email.deadline && email.deadline !== "none" && (
                  <span className="text-xs text-orange-400">
                    Deadline: {email.deadline}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleView(email)}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  View
                </button>
                <button
                  onClick={() => handleReply(email)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Reply
                </button>
                <button
                  onClick={() => handleDelete(email.gmail_id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400">{email.from_address}</p>
            <p className="font-semibold">{email.subject}</p>
            <p className="text-sm text-blue-400 mt-1">
              AI Summary: {email.summary}
            </p>
            <p className="text-sm text-gray-400 mt-1">{email.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
