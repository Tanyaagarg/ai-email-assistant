import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import sql from "../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const emails = await sql`
    SELECT * FROM emails 
    WHERE user_email = ${session.user.email}
    AND priority = 'High'
    ORDER BY received_at DESC
  `;

  return Response.json({ emails });
}