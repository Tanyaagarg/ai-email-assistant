import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import sql from "../../lib/db";
import { summarizeEmail, analyzeEmail } from "../../lib/gemini";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pageToken = searchParams.get("pageToken") || "";

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10${pageToken ? `&pageToken=${pageToken}` : ""}`;

  const listResponse = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const listData = await listResponse.json();
  const messages = listData.messages || [];
  const nextPageToken = listData.nextPageToken || null;

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const existing = await sql`SELECT * FROM emails WHERE gmail_id = ${msg.id}`;
      if (existing.length > 0 && existing[0].thread_id) {
        return existing[0];
      }

      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      const headers = data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "Unknown";
      const threadId = data.threadId;

      const summary = await summarizeEmail(subject, from, data.snippet);
      const { priority, deadline } = await analyzeEmail(subject, from, data.snippet);

      await sql`INSERT INTO emails (user_email, gmail_id, thread_id, subject, from_address, snippet, summary, priority, deadline)
        VALUES (${session.user.email}, ${msg.id}, ${threadId}, ${subject}, ${from}, ${data.snippet}, ${summary}, ${priority}, ${deadline})
        ON CONFLICT (gmail_id) DO UPDATE SET thread_id = ${threadId}, summary = ${summary}, priority = ${priority}, deadline = ${deadline}`;

      return { gmail_id: msg.id, thread_id: threadId, subject, from_address: from, snippet: data.snippet, summary, priority, deadline };
    })
  );

  return Response.json({ emails, nextPageToken });
}