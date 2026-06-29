"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (status === "loading" || loading) {
    return <div className="p-8">Loading your emails...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Inbox</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
      <p className="mb-4">Welcome, {session?.user?.name}!</p>
      <div>
        {emails.map((email) => (
          <div key={email.id} className="border border-gray-700 p-4 mb-2 rounded">
            <p className="text-sm text-gray-400">{email.from}</p>
            <p className="font-semibold">{email.subject}</p>
            <p className="text-sm text-blue-400 mt-1">AI Summary: {email.summary}</p>
            <p className="text-sm text-gray-400 mt-1">{email.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
