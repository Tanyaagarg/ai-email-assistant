import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import sql from "../../lib/db";
import { summarizeEmail, analyzeEmail } from "../../lib/gemini";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const listResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const listData = await listResponse.json();
  const messages = listData.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const existing = await sql`SELECT * FROM emails WHERE gmail_id = ${msg.id}`;
      if (existing.length > 0) {
        return existing[0];
      }

      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      const headers = data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "Unknown";

      const summary = await summarizeEmail(subject, from, data.snippet);
      const { priority, deadline } = await analyzeEmail(subject, from, data.snippet);

      await sql`INSERT INTO emails (user_email, gmail_id, subject, from_address, snippet, summary, priority, deadline)
        VALUES (${session.user.email}, ${msg.id}, ${subject}, ${from}, ${data.snippet}, ${summary}, ${priority}, ${deadline})
        ON CONFLICT (gmail_id) DO NOTHING`;

      return { gmail_id: msg.id, subject, from_address: from, snippet: data.snippet, summary, priority, deadline };
    })
  );

  return Response.json({ emails });
}