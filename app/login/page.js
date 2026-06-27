"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-8">AI Email Assistant</h1>
      <button
        onClick={() => signIn("google", { callbackUrl: "/inbox" })}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600"
      >
        Sign in with Google
      </button>
    </div>
  );
}