import { truncateTodos, ensureSchema } from "@/lib/db";

export const HAS_DB = Boolean(process.env.POSTGRES_URL);

export async function resetDb() {
  await ensureSchema();
  await truncateTodos();
}

// Use this on every describe block that needs the database. If POSTGRES_URL is
// not configured, the block is skipped with a warning rather than failing —
// keeps `npm test` runnable on a fresh checkout without a Postgres URL.
export const describeWithDb = HAS_DB
  ? describe
  : ((describe.skip as unknown) as jest.Describe);
