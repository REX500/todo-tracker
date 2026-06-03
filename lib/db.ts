import { sql } from "@vercel/postgres";
import type { Status, Todo, TodoInput } from "./types";

/**
 * Ensure the `todos` table exists. Safe to call on every request; the no-op
 * cost is negligible and it doubles as the migration for the one-shot
 * `npm run db:init` script.
 */
export async function ensureSchema() {
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
}

function toIsoDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") return value.slice(0, 10);
  return null;
}

function toTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function mapRow(row: Record<string, unknown>): Todo {
  return {
    id: Number(row.id),
    task: String(row.task),
    status: (row.status as Status) ?? "To Do",
    tag: (row.tag as string | null) ?? null,
    stakeholder: (row.stakeholder as string | null) ?? null,
    deadline: toIsoDate(row.deadline),
    url: (row.url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: toTimestamp(row.created_at),
    updated_at: toTimestamp(row.updated_at)
  };
}

export async function listTodos(): Promise<Todo[]> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM todos ORDER BY created_at ASC, id ASC;`;
  return rows.map(mapRow);
}

export async function getTodo(id: number): Promise<Todo | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM todos WHERE id = ${id};`;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createTodo(input: TodoInput): Promise<Todo> {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO todos (task, status, tag, stakeholder, deadline, url, notes)
    VALUES (
      ${input.task},
      ${input.status},
      ${input.tag},
      ${input.stakeholder},
      ${input.deadline},
      ${input.url},
      ${input.notes}
    )
    RETURNING *;
  `;
  return mapRow(rows[0]);
}

export async function updateTodo(id: number, input: TodoInput): Promise<Todo | null> {
  await ensureSchema();
  const { rows } = await sql`
    UPDATE todos
    SET task        = ${input.task},
        status      = ${input.status},
        tag         = ${input.tag},
        stakeholder = ${input.stakeholder},
        deadline    = ${input.deadline},
        url         = ${input.url},
        notes       = ${input.notes},
        updated_at  = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function setTodoStatus(id: number, status: Status): Promise<Todo | null> {
  await ensureSchema();
  const { rows } = await sql`
    UPDATE todos
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteTodo(id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM todos WHERE id = ${id};`;
  return (rowCount ?? 0) > 0;
}

export async function importTodos(items: TodoInput[]): Promise<number> {
  await ensureSchema();
  if (items.length === 0) return 0;
  // No multi-statement transaction is exposed by @vercel/postgres's sql tag
  // here, so insert one-by-one. The import route validates the whole batch
  // up front, so partial-failure here is treated as a server error and
  // reported as such.
  for (const item of items) {
    await sql`
      INSERT INTO todos (task, status, tag, stakeholder, deadline, url, notes)
      VALUES (
        ${item.task},
        ${item.status},
        ${item.tag},
        ${item.stakeholder},
        ${item.deadline},
        ${item.url},
        ${item.notes}
      );
    `;
  }
  return items.length;
}

export async function truncateTodos(): Promise<void> {
  await ensureSchema();
  await sql`TRUNCATE TABLE todos RESTART IDENTITY;`;
}
