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
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);

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
    setEmails((prev) => [...prev, ...(data.emails || [])]);
    setNextPageToken(data.nextPageToken || null);
    setLoadingMore(false);
  };

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

  const handleStar = async (email) => {
    const action = email.is_starred ? "unstar" : "star";
    const res = await fetch(`/api/emails/${email.gmail_id}/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setEmails((prev) =>
        prev.map((e) =>
          e.gmail_id === email.gmail_id ? { ...e, is_starred: !e.is_starred } : e
        )
      );
    }
  };

  const handleToggleRead = async (email) => {
    const action = email.is_unread ? "read" : "unread";
    const res = await fetch(`/api/emails/${email.gmail_id}/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setEmails((prev) =>
        prev.map((e) =>
          e.gmail_id === email.gmail_id ? { ...e, is_unread: !e.is_unread } : e
        )
      );
    }
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
      alert("Email sent!");
    } else {
      alert("Failed to send email.");
    }
  };

  if (status === "loading" || loading)
    return <div className="p-8">Loading your emails...</div>;

  const priorityColor = (priority) => {
    if (priority === "High") return "bg-red-500";
    if (priority === "Medium") return "bg-yellow-500";
    return "bg-green-500";
  };

  const categoryIcon = (category) => {
    if (category === "Work") return "💼";
    if (category === "Personal") return "👤";
    if (category === "Promotions") return "🛍️";
    if (category === "Social") return "👥";
    return "📬";
  };

  const categories = [
    "All",
    "Work",
    "Personal",
    "Promotions",
    "Social",
    "Updates",
  ];

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || email.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Inbox</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setComposing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Compose ✉️
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Do First 🔥
          </button>
                    <button
            onClick={() => router.push("/todo")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            To-Do ✅
          </button>
          <button
            onClick={() => router.push("/analytics")}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Analytics 📊
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

      <input
        type="text"
        placeholder="Search emails..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-gray-800 text-white p-3 rounded-lg mb-4 border border-gray-700 focus:outline-none focus:border-blue-500"
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm ${activeCategory === cat ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {composing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">New Email</h2>
            <input
              type="email"
              placeholder="To (recipient email)"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded-lg mb-3 border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Subject"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded-lg mb-3 border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <textarea
              placeholder="Write your message..."
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded-lg mb-4 h-40 resize-none border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setComposing(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCompose}
                disabled={composeSending}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {composeSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
            <h2 className="text-lg font-bold mb-1">{viewingEmail.subject}</h2>
            <p className="text-sm text-gray-400 mb-4">
              From: {viewingEmail.from_address}
            </p>
            <div className="overflow-y-auto flex-1 rounded-lg mb-4 bg-white">
              {bodyLoading ? (
                <p className="text-blue-400 p-4">Loading email...</p>
              ) : emailBody.isHtml ? (
                <iframe
                  srcDoc={emailBody.content}
                  className="w-full h-full rounded-lg border-0 bg-white"
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
        {filteredEmails.map((email) => (
          <div
            key={email.gmail_id}
            className={`border border-gray-700 p-4 mb-2 rounded ${email.is_unread ? "border-l-4 border-l-blue-500 bg-gray-900" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs text-white px-2 py-0.5 rounded-full ${priorityColor(email.priority)}`}
                >
                  {email.priority || "Medium"}
                </span>
                <span className="text-xs text-gray-400">
                  {categoryIcon(email.category)} {email.category || "Updates"}
                </span>
                {email.deadline && email.deadline !== "none" && (
                  <span className="text-xs text-orange-400">
                    Deadline: {email.deadline}
                  </span>
                )}
              </div>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => handleStar(email)}
                  className="text-sm hover:opacity-80"
                  title="Star"
                >
                  {email.is_starred ? "⭐" : "☆"}
                </button>
                <button
                  onClick={() => handleToggleRead(email)}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  {email.is_unread ? "Mark read" : "Mark unread"}
                </button>
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
            <p className={email.is_unread ? "font-bold text-white" : "font-semibold"}>
              {email.subject}
            </p>
            <p className="text-sm text-blue-400 mt-1">
              AI Summary: {email.summary}
            </p>
            <p className="text-sm text-gray-400 mt-1">{email.snippet}</p>
            {email.actionItems && email.actionItems.length > 0 && (
              <div className="mt-2 bg-gray-800 rounded p-2">
                <p className="text-xs font-semibold text-yellow-400 mb-1">
                  ✅ Action Items
                </p>
                <ul className="list-disc list-inside text-sm text-gray-200">
                  {email.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More Emails"}
          </button>
        </div>
      )}
    </div>
  );
}