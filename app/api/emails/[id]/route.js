import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import sql from "../../../lib/db";

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const gmailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!gmailRes.ok) {
    return Response.json({ error: "Failed to delete from Gmail" }, { status: 500 });
  }

  await sql`DELETE FROM emails WHERE gmail_id = ${id}`;

  return Response.json({ message: "Email deleted" });
}