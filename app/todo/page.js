"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Square, CheckSquare, Trash2, Mail, Clock3 } from "lucide-react";
import Shell from "../components/Shell";

export default function TodoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [viewing, setViewing] = useState(null);
  const [emailBody, setEmailBody] = useState({ content: "", isHtml: false });
  const [bodyLoading, setBodyLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/action-items")
        .then((r) => r.json())
        .then((d) => {
          setTasks(d.tasks || []);
          setLoading(false);
        });
    }
  }, [status]);

  const toggle = (key) => setChecked((p) => ({ ...p, [key]: !p[key] }));

  const handleDelete = async (task) => {
    const res = await fetch("/api/action-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gmail_id: task.gmail_id, text: task.text }),
    });
    if (res.ok) setTasks((p) => p.filter((t) => !(t.gmail_id === task.gmail_id && t.text === task.text)));
  };

  const handleOpen = async (task) => {
    setViewing(task);
    setEmailBody({ content: "", isHtml: false });
    setBodyLoading(true);
    const res = await fetch(`/api/emails/${task.gmail_id}/content`);
    const data = await res.json();
    setEmailBody({ content: data.body || "Could not load email.", isHtml: data.isHtml });
    setBodyLoading(false);
  };

  const prioRank = (p) => (p === "High" ? 0 : p === "Medium" ? 1 : 2);
  const deadlineVal = (d) => {
    if (!d || d === "none") return Number.MAX_SAFE_INTEGER;
    const t = Date.parse(d);
    return isNaN(t) ? Number.MAX_SAFE_INTEGER - 1 : t;
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const pr = prioRank(a.priority) - prioRank(b.priority);
    if (pr !== 0) return pr;
    return deadlineVal(a.deadline) - deadlineVal(b.deadline);
  });

  const priorityPill = (p) => {
    if (p === "High") return "bg-red-500/15 text-red-500";
    if (p === "Medium") return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400";
    return "bg-green-500/15 text-green-600 dark:text-green-400";
  };

  if (status === "loading" || loading)
    return (
      <Shell title="To-Do">
        <p className="text-muted">Loading...</p>
      </Shell>
    );

  return (
    <Shell title="To-Do">
      <p className="text-muted mb-6">Tasks sorted by priority and deadline. Click a task to open its email.</p>

      {viewing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-line rounded-2xl p-6 w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={18} className="text-accent-soft" />
              <h2 className="text-lg font-semibold">{viewing.subject}</h2>
            </div>
            <p className="text-sm text-muted mb-4">From: {viewing.from}</p>
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
              <button onClick={() => setViewing(null)} className="px-4 py-2 rounded-lg border border-line hover:bg-card2">Close</button>
            </div>
          </div>
        </div>
      )}

      {sortedTasks.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-8 text-center text-muted">
          No action items right now. You&apos;re all caught up! 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedTasks.map((task) => {
            const key = `${task.gmail_id}-${task.text}`;
            return (
              <div
                key={key}
                onClick={() => handleOpen(task)}
                className="flex items-start gap-3 bg-card border border-line rounded-xl p-4 cursor-pointer transition hover:border-accent hover:shadow-lg hover:shadow-accent/10"
              >
                <button onClick={(e) => { e.stopPropagation(); toggle(key); }} className="mt-0.5 text-accent-soft shrink-0">
                  {checked[key] ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <div className={`flex-1 ${checked[key] ? "line-through text-muted" : ""}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityPill(task.priority)}`}>{task.priority || "Medium"}</span>
                    {task.deadline && task.deadline !== "none" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 flex items-center gap-1">
                        <Clock3 size={11} /> {task.deadline}
                      </span>
                    )}
                  </div>
                  <p className="font-medium">{task.text}</p>
                  <p className="text-xs text-muted mt-1">From: {task.from}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(task); }} className="text-muted hover:text-red-500 transition shrink-0" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}