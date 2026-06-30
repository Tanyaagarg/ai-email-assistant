import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import sql from "../../../../lib/db";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { action } = await request.json();

  let addLabelIds = [];
  let removeLabelIds = [];

  if (action === "star") addLabelIds = ["STARRED"];
  else if (action === "unstar") removeLabelIds = ["STARRED"];
  else if (action === "read") removeLabelIds = ["UNREAD"];
  else if (action === "unread") addLabelIds = ["UNREAD"];
  else return Response.json({ error: "Invalid action" }, { status: 400 });

  const gmailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ addLabelIds, removeLabelIds }),
  });

  if (!gmailRes.ok) {
    return Response.json({ error: "Failed to update email" }, { status: 500 });
  }

  if (action === "star") await sql`UPDATE emails SET is_starred = true WHERE gmail_id = ${id}`;
  else if (action === "unstar") await sql`UPDATE emails SET is_starred = false WHERE gmail_id = ${id}`;
  else if (action === "read") await sql`UPDATE emails SET is_unread = false WHERE gmail_id = ${id}`;
  else if (action === "unread") await sql`UPDATE emails SET is_unread = true WHERE gmail_id = ${id}`;

  return Response.json({ message: "Updated" });
}