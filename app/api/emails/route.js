import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }
  );

  const listData = await listResponse.json();
  const messages = listData.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const data = await res.json();
      const headers = data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "Unknown";
      return { id: msg.id, subject, from, snippet: data.snippet };
    })
  );

  return Response.json({ emails });
}