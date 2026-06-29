"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/priority-emails")
        .then((res) => res.json())
        .then((data) => { setEmails(data.emails || []); setLoading(false); });
    }
  }, [status]);

  if (status === "loading" || loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Do First 🔥</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push("/inbox")} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Inbox</button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Sign out</button>
        </div>
      </div>
      <p className="text-gray-400 mb-6">These emails need your attention first.</p>
      {emails.length === 0 ? (
        <p className="text-gray-500">No high priority emails right now!</p>
      ) : (
        <div>
          {emails.map((email) => (
            <div key={email.id} className="border border-red-700 p-4 mb-2 rounded">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white px-2 py-0.5 rounded-full bg-red-500">High</span>
                {email.deadline && email.deadline !== "none" && (
                  <span className="text-xs text-orange-400">Deadline: {email.deadline}</span>
                )}
              </div>
              <p className="text-sm text-gray-400">{email.from_address}</p>
              <p className="font-semibold">{email.subject}</p>
              <p className="text-sm text-blue-400 mt-1">AI Summary: {email.summary}</p>
              <p className="text-sm text-gray-400 mt-1">{email.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}