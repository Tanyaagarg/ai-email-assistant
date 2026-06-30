import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import sql from "../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await sql`
    SELECT gmail_id, subject, from_address, deadline, action_items
    FROM emails
    WHERE user_email = ${session.user.email}
    AND action_items IS NOT NULL
    ORDER BY received_at DESC
  `;

  const tasks = [];
  for (const row of rows) {
    let items = [];
    try {
      items = JSON.parse(row.action_items);
    } catch {
      items = [];
    }
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item) => {
        tasks.push({
          text: item,
          subject: row.subject,
          from: row.from_address,
          deadline: row.deadline,
          gmail_id: row.gmail_id,
        });
      });
    }
  }

  return Response.json({ tasks });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { gmail_id, text } = await request.json();

  const rows = await sql`SELECT action_items FROM emails WHERE gmail_id = ${gmail_id} AND user_email = ${session.user.email}`;
  if (rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });

  let items = [];
  try {
    items = JSON.parse(rows[0].action_items);
  } catch {
    items = [];
  }

  const updated = items.filter((item) => item !== text);
  await sql`UPDATE emails SET action_items = ${JSON.stringify(updated)} WHERE gmail_id = ${gmail_id} AND user_email = ${session.user.email}`;

  return Response.json({ message: "Task deleted" });
}