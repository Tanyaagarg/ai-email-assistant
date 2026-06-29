import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

function extractBody(payload) {
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return { html: true, content: Buffer.from(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8") };
  }
  if (payload.body?.data) {
    return { html: false, content: Buffer.from(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8") };
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return { html: true, content: Buffer.from(part.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8") };
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return { html: false, content: Buffer.from(part.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8") };
      }
    }
  }
  return { html: false, content: "Could not load email content." };
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  const data = await res.json();
  const { html, content } = extractBody(data.payload);

  return Response.json({ body: content, isHtml: html });
}