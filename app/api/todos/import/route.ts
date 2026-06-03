import { NextResponse } from "next/server";
import { importTodos } from "@/lib/db";
import { TodoImportSchema, TodoInputSchema } from "@/lib/schema";
import type { TodoInput } from "@/lib/schema";
import { parseJsonBody, serverError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, TodoImportSchema);
  if (!parsed.ok) return parsed.response;

  // Validate each item through TodoInputSchema so the transforms (empty
  // string → null, status default, etc.) run uniformly with the regular
  // create path. Any single invalid item rejects the whole batch.
  const items: TodoInput[] = [];
  for (let i = 0; i < parsed.data.todos.length; i++) {
    const result = TodoInputSchema.safeParse(parsed.data.todos[i]);
    if (!result.success) {
      return NextResponse.json(
        { error: `Invalid todo at index ${i}`, issues: result.error.issues },
        { status: 400 }
      );
    }
    items.push(result.data);
  }

  try {
    const inserted = await importTodos(items);
    return NextResponse.json({ ok: true, inserted });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Failed to import todos");
  }
}
