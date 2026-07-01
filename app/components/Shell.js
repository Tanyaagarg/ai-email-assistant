"use client";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, CheckSquare, BarChart3, LogOut, Mail } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const nav = [
  { label: "Inbox", icon: Inbox, path: "/inbox" },
  { label: "To-Do", icon: CheckSquare, path: "/todo" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
];

export default function Shell({ title, actions, children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-bg text-content">
      <aside className="w-60 shrink-0 border-r border-line bg-card flex flex-col p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-accent-text">
            <Mail size={20} />
          </div>
          <span className="font-semibold text-base">AI Email Assistant</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-accent to-accent2 text-accent-text"
                    : "text-muted hover:bg-card2 hover:text-content"
                }`}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line pt-4 mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-text flex items-center justify-center text-sm font-semibold shrink-0">
              {session?.user?.name?.[0] || "U"}
            </div>
            <p className="text-sm truncate">{session?.user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg border border-line hover:bg-card2 transition"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-8 py-5 border-b border-line">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="flex items-center gap-3">{actions}</div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}