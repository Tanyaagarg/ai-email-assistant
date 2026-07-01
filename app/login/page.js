"use client";
import { signIn } from "next-auth/react";
import { Mail, Sparkles, Flame, ListChecks, BarChart3 } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg text-content">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-card border border-line rounded-3xl p-8 text-center">
                <img src="/logo.svg" alt="MailMind" className="w-16 h-16 mx-auto mb-5" />

        <h1 className="text-2xl font-semibold mb-2">AI Email Assistant</h1>
        <p className="text-muted text-sm mb-7 leading-relaxed">
          Let AI read, prioritize, summarize, and act on your Gmail — so you only focus on what matters.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/inbox" })}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-accent to-accent2 text-accent-text px-6 py-3 rounded-xl text-base font-medium hover:opacity-90 transition mb-7"
        >
          <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
          </span>
          Sign in with Google
        </button>

        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="bg-card2 rounded-lg p-3 text-xs flex items-center gap-2">
            <Sparkles size={15} className="text-accent-soft" /> AI summaries
          </div>
          <div className="bg-card2 rounded-lg p-3 text-xs flex items-center gap-2">
            <Flame size={15} className="text-accent-soft" /> Smart priority
          </div>
          <div className="bg-card2 rounded-lg p-3 text-xs flex items-center gap-2">
            <ListChecks size={15} className="text-accent-soft" /> Action items
          </div>
          <div className="bg-card2 rounded-lg p-3 text-xs flex items-center gap-2">
            <BarChart3 size={15} className="text-accent-soft" /> Inbox analytics
          </div>
        </div>

        <p className="text-muted text-xs mt-5">
          We only access your Gmail to show and manage your emails.
        </p>
      </div>
    </div>
  );
}