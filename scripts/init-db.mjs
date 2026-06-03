// Run with: `npm run db:init` (after `vercel env pull .env.local` so POSTGRES_URL is set)
import { sql } from "@vercel/postgres";
import "dotenv/config";

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS todos (
      id          SERIAL PRIMARY KEY,
      task        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'To Do',
      tag         TEXT,
      stakeholder TEXT,
      deadline    DATE,
      url         TEXT,
      notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log("todos table is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
