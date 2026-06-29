import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import sql from "../../lib/db";
import { summarizeEmail } from "../../lib/gemini";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }
  );

  const listData = await listResponse.json();
  const messages = listData.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const data = await res.json();
      const headers = data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "Unknown";

      const summary = await summarizeEmail(subject, from, data.snippet);

      await sql`
        INSERT INTO emails (user_email, gmail_id, subject, from_address, snippet, summary)
        VALUES (${session.user.email}, ${msg.id}, ${subject}, ${from}, ${data.snippet}, ${summary})
        ON CONFLICT (gmail_id) DO UPDATE SET summary = ${summary}
      `;

      return { id: msg.id, subject, from, snippet: data.snippet, summary };
    })
  );

  return Response.json({ emails });
}