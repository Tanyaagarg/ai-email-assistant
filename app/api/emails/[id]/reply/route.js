import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { generateReply } from "../../../../lib/gemini";
import sql from "../../../../lib/db";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const email = await sql`SELECT * FROM emails WHERE gmail_id = ${id}`;
  if (email.length === 0) return Response.json({ error: "Email not found" }, { status: 404 });

  const suggestion = await generateReply(email[0].subject, email[0].from_address, email[0].snippet);
  return Response.json({ suggestion });
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { replyText } = await request.json();

  const email = await sql`SELECT * FROM emails WHERE gmail_id = ${id}`;
  if (email.length === 0) return Response.json({ error: "Email not found" }, { status: 404 });

  const toAddress = email[0].from_address;
  const subject = email[0].subject.startsWith("Re:") ? email[0].subject : `Re: ${email[0].subject}`;
  const threadId = email[0].thread_id;

  const rawEmail = btoa(`To: ${toAddress}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${replyText}`)
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: rawEmail, threadId }),
  });

  if (!gmailRes.ok) return Response.json({ error: "Failed to send email" }, { status: 500 });

  return Response.json({ message: "Reply sent!" });
}