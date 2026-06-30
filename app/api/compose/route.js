import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { to, subject, body } = await request.json();

  if (!to || !subject) {
    return Response.json({ error: "Recipient and subject are required" }, { status: 400 });
  }

  const rawEmail = btoa(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body || ""}`
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawEmail }),
  });

  if (!gmailRes.ok) {
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  return Response.json({ message: "Email sent!" });
}