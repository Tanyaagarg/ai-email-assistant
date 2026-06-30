import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

function decode(data) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function findPart(payload, mimeType) {
  if (payload.mimeType === mimeType && payload.body?.data) {
    return payload.body.data;
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const found = findPart(part, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function extractBody(payload) {
  const html = findPart(payload, "text/html");
  if (html) return { html: true, content: decode(html) };

  const plain = findPart(payload, "text/plain");
  if (plain) return { html: false, content: decode(plain) };

  if (payload.body?.data) return { html: false, content: decode(payload.body.data) };

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