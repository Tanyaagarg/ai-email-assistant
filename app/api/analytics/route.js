import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import sql from "../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const email = session.user.email;

  const totalRows = await sql`SELECT COUNT(*)::int AS count FROM emails WHERE user_email = ${email}`;
  const total = totalRows[0].count;

  const byCategory = await sql`
    SELECT category, COUNT(*)::int AS count
    FROM emails WHERE user_email = ${email}
    GROUP BY category ORDER BY count DESC`;

  const byPriority = await sql`
    SELECT priority, COUNT(*)::int AS count
    FROM emails WHERE user_email = ${email}
    GROUP BY priority ORDER BY count DESC`;

  const unreadRows = await sql`SELECT COUNT(*)::int AS count FROM emails WHERE user_email = ${email} AND is_unread = true`;
  const starredRows = await sql`SELECT COUNT(*)::int AS count FROM emails WHERE user_email = ${email} AND is_starred = true`;

  const topSenders = await sql`
    SELECT from_address, COUNT(*)::int AS count
    FROM emails WHERE user_email = ${email}
    GROUP BY from_address ORDER BY count DESC LIMIT 5`;

  return Response.json({
    total,
    unread: unreadRows[0].count,
    starred: starredRows[0].count,
    byCategory,
    byPriority,
    topSenders,
  });
}