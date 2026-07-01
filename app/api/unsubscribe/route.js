import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { link } = await request.json();
  if (!link || !/^https?:\/\//.test(link)) {
    return Response.json({ error: "Invalid link" }, { status: 400 });
  }

  try {
    await fetch(link, { method: "GET" });
  } catch (e) {
    // some unsubscribe endpoints error but still process — ignore
  }

  return Response.json({ message: "ok" });
}