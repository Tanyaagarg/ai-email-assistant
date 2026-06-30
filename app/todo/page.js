"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TodoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/action-items")
        .then((res) => res.json())
        .then((data) => { setTasks(data.tasks || []); setLoading(false); });
    }
  }, [status]);

  const toggle = (index) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleDelete = async (task, index) => {
    const res = await fetch("/api/action-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gmail_id: task.gmail_id, text: task.text }),
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  if (status === "loading" || loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your To-Do List ✅</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push("/inbox")} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Inbox</button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Sign out</button>
        </div>
      </div>
      <p className="text-gray-400 mb-6">All the tasks the AI found across your emails.</p>

      {tasks.length === 0 ? (
        <p className="text-gray-500">No action items right now. You're all caught up! 🎉</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-start gap-3 border border-gray-700 p-4 rounded">
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => toggle(i)}
                className="mt-1 w-5 h-5"
              />
              <div className={`flex-1 ${checked[i] ? "line-through text-gray-500" : ""}`}>
                <p className="font-medium">{task.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  From: {task.from} · {task.subject}
                  {task.deadline && task.deadline !== "none" && (
                    <span className="text-orange-400"> · Deadline: {task.deadline}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(task, i)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}