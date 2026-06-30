"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/analytics")
        .then((res) => res.json())
        .then((d) => { setData(d); setLoading(false); });
    }
  }, [status]);

  if (status === "loading" || loading) return <div className="p-8">Loading analytics...</div>;

  const max = (arr) => Math.max(...arr.map((x) => x.count), 1);

  const categoryColor = (cat) => {
    if (cat === "Work") return "bg-purple-500";
    if (cat === "Personal") return "bg-pink-500";
    if (cat === "Promotions") return "bg-yellow-500";
    if (cat === "Social") return "bg-blue-500";
    return "bg-gray-500";
  };

  const priorityColor = (p) => {
    if (p === "High") return "bg-red-500";
    if (p === "Medium") return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Inbox Analytics 📊</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push("/inbox")} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Inbox</button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Sign out</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-3xl font-bold">{data.total}</p>
          <p className="text-gray-400 text-sm mt-1">Total Emails</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-blue-400">{data.unread}</p>
          <p className="text-gray-400 text-sm mt-1">Unread</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-yellow-400">{data.starred}</p>
          <p className="text-gray-400 text-sm mt-1">Starred</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="font-bold mb-4">By Category</h2>
        {data.byCategory.map((c) => (
          <div key={c.category} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>{c.category || "Unknown"}</span>
              <span className="text-gray-400">{c.count}</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3">
              <div className={`${categoryColor(c.category)} h-3 rounded-full`} style={{ width: `${(c.count / max(data.byCategory)) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="font-bold mb-4">By Priority</h2>
        {data.byPriority.map((p) => (
          <div key={p.priority} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>{p.priority || "Unknown"}</span>
              <span className="text-gray-400">{p.count}</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3">
              <div className={`${priorityColor(p.priority)} h-3 rounded-full`} style={{ width: `${(p.count / max(data.byPriority)) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="font-bold mb-4">Top Senders</h2>
        {data.topSenders.map((s, i) => (
          <div key={i} className="flex justify-between text-sm mb-2 border-b border-gray-700 pb-2">
            <span className="truncate mr-4">{s.from_address}</span>
            <span className="text-gray-400 whitespace-nowrap">{s.count} emails</span>
          </div>
        ))}
      </div>
    </div>
  );
}