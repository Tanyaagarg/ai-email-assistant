import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import sql from "../../../../lib/db";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { priority } = await request.json();

  await sql`UPDATE emails SET priority = ${priority} WHERE gmail_id = ${id} AND user_email = ${session.user.email}`;

  return Response.json({ message: "ok" });
}