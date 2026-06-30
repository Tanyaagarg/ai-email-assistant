import sql from "../../lib/db";

export async function GET() {
  await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS emails (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, gmail_id TEXT UNIQUE NOT NULL, subject TEXT, from_address TEXT, snippet TEXT, received_at TIMESTAMP DEFAULT NOW())`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS summary TEXT`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS priority TEXT`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS deadline TEXT`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS thread_id TEXT`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS category TEXT`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS action_items TEXT`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_unread BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE`;
  return Response.json({ message: "Database tables created successfully!" });
}