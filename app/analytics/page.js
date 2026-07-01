"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Mail, MailOpen, Star } from "lucide-react";
import Shell from "../components/Shell";

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/analytics")
        .then((r) => r.json())
        .then((d) => {
          setData(d);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || loading || !data)
    return (
      <Shell title="Analytics">
        <p className="text-muted">Loading analytics...</p>
      </Shell>
    );

  const R = 54;
  const C = 2 * Math.PI * R;

  const catColor = (c) =>
    ({ Work: "#8b5cf6", Personal: "#ec4899", Promotions: "#f97316", Social: "#3b82f6", Updates: "#f59e0b" }[c] || "#9ca3af");
  const prioColor = (p) =>
    ({ High: "#ef4444", Medium: "#eab308", Low: "#22c55e" }[p] || "#9ca3af");

  const catTotal = data.byCategory.reduce((s, c) => s + c.count, 0) || 1;
  let cum = 0;
  const segments = data.byCategory.map((c) => {
    const len = (c.count / catTotal) * C;
    const seg = { color: catColor(c.category), len, offset: -cum };
    cum += len;
    return seg;
  });

  const prioTotal = data.byPriority.reduce((s, p) => s + p.count, 0) || 1;
  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);

  return (
    <Shell title="Analytics">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gradient-to-br from-accent to-accent2 text-accent-text rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={20} />
            <span className="text-sm font-medium">Total Emails</span>
          </div>
          <p className="text-4xl font-bold leading-none">{data.total}</p>
          <p className="text-xs mt-2 opacity-80">across your inbox</p>
        </div>

        <div className="bg-card border border-line rounded-2xl p-5">
          <div className="w-9 h-9 rounded-lg bg-card2 flex items-center justify-center text-accent-soft mb-3">
            <MailOpen size={19} />
          </div>
          <p className="text-2xl font-bold leading-none">{data.unread}</p>
          <p className="text-muted text-sm mt-1.5">Unread</p>
        </div>

        <div className="bg-card border border-line rounded-2xl p-5">
          <div className="w-9 h-9 rounded-lg bg-card2 flex items-center justify-center text-accent-soft mb-3">
            <Star size={19} />
          </div>
          <p className="text-2xl font-bold leading-none">{data.starred}</p>
          <p className="text-muted text-sm mt-1.5">Starred</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-line rounded-2xl p-5">
          <h2 className="font-semibold mb-3">By Category</h2>
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 140 140" width="118" height="118" className="shrink-0">
              <g transform="rotate(-90 70 70)">
                <circle cx="70" cy="70" r={R} fill="none" strokeWidth="17" style={{ stroke: "var(--card2)" }} />
                {segments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    strokeWidth="17"
                    stroke={seg.color}
                    strokeDasharray={`${seg.len} ${C - seg.len}`}
                    strokeDashoffset={seg.offset}
                  />
                ))}
              </g>
              <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="700" className="fill-content">{data.total}</text>
              <text x="70" y="85" textAnchor="middle" fontSize="10" className="fill-muted">emails</text>
            </svg>
            <div className="flex flex-col gap-2 text-xs flex-1">
              {data.byCategory.map((c) => (
                <span key={c.category} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: catColor(c.category) }} />
                  {c.category || "Unknown"}
                  <b className="ml-auto font-semibold">{c.count}</b>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-line rounded-2xl p-5">
          <h2 className="font-semibold mb-4">By Priority</h2>
          <div className="flex h-4 rounded-full overflow-hidden mb-4">
            {data.byPriority.map((p) => (
              <div key={p.priority} style={{ width: `${(p.count / prioTotal) * 100}%`, background: prioColor(p.priority) }} />
            ))}
          </div>
          <div className="flex flex-col gap-2.5 text-xs">
            {data.byPriority.map((p) => (
              <span key={p.priority} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: prioColor(p.priority) }} />
                {p.priority || "Unknown"}
                <b className="ml-auto font-semibold">{p.count}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-line rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Top Senders</h2>
        <div className="flex flex-col gap-2">
          {data.topSenders.map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-card2 rounded-xl p-2.5">
              <span className="w-6 text-center text-sm shrink-0">{medal(i)}</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-text flex items-center justify-center text-sm font-semibold shrink-0">
                {(s.from_address || "?").trim().charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 truncate text-sm">{s.from_address}</span>
              <span className="text-xs font-medium bg-gradient-to-r from-accent to-accent2 text-accent-text px-3 py-1 rounded-full shrink-0">
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}