import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import sql from "../../lib/db";
import { analyzeFullEmail } from "../../lib/gemini";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startToken = searchParams.get("pageToken") || "";
  const isLoadMore = !!startToken;

  let token = startToken;
  let nextPageToken = null;
  let addedNew = 0;
  let pages = 0;

  do {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10${token ? `&pageToken=${token}` : ""}`;
    const listResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const listData = await listResponse.json();
    const messages = listData.messages || [];
    nextPageToken = listData.nextPageToken || null;

    for (const msg of messages) {
      const existing = await sql`SELECT gmail_id, thread_id, category, action_items, summary FROM emails WHERE gmail_id = ${msg.id}`;
      if (existing.length > 0 && existing[0].thread_id && existing[0].category && existing[0].action_items && existing[0].summary !== "Summary unavailable") {
        continue;
      }

      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=List-Unsubscribe`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      const headers = data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "Unknown";
      const threadId = data.threadId;
      const labelIds = data.labelIds || [];
      const isUnread = labelIds.includes("UNREAD");
      const isStarred = labelIds.includes("STARRED");
      const receivedAt = data.internalDate ? new Date(parseInt(data.internalDate, 10)).toISOString() : new Date().toISOString();

      const unsubHeader = headers.find((h) => h.name === "List-Unsubscribe")?.value || "";
      const unsubMatch = unsubHeader.match(/<(https?:[^>]+)>/);
      const unsubscribeLink = unsubMatch ? unsubMatch[1] : null;

      const { summary, priority, deadline, category, actionItems } = await analyzeFullEmail(subject, from, data.snippet);
      const actionItemsJson = JSON.stringify(actionItems);

      await sql`INSERT INTO emails (user_email, gmail_id, thread_id, subject, from_address, snippet, summary, priority, deadline, category, action_items, is_unread, is_starred, unsubscribe_link, received_at)
        VALUES (${session.user.email}, ${msg.id}, ${threadId}, ${subject}, ${from}, ${data.snippet}, ${summary}, ${priority}, ${deadline}, ${category}, ${actionItemsJson}, ${isUnread}, ${isStarred}, ${unsubscribeLink}, ${receivedAt})
        ON CONFLICT (gmail_id) DO UPDATE SET thread_id = ${threadId}, subject = ${subject}, from_address = ${from}, snippet = ${data.snippet}, summary = ${summary}, priority = ${priority}, deadline = ${deadline}, category = ${category}, action_items = ${actionItemsJson}, is_unread = ${isUnread}, is_starred = ${isStarred}, unsubscribe_link = ${unsubscribeLink}, received_at = ${receivedAt}`;

      addedNew++;
    }

    token = nextPageToken;
    pages++;
  } while (isLoadMore && addedNew === 0 && token && pages < 8);

  const rows = await sql`
    SELECT * FROM emails
    WHERE user_email = ${session.user.email}
    AND (snoozed_until IS NULL OR snoozed_until <= NOW())
    ORDER BY received_at DESC
  `;

  const parseItems = (v) => {
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  };

  const emails = rows.map((r) => ({
    ...r,
    actionItems: parseItems(r.action_items),
    is_unread: r.is_unread || false,
    is_starred: r.is_starred || false,
  }));

  return Response.json({ emails, nextPageToken });
}