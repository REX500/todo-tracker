import { NextResponse } from "next/server";
import { deleteTodo, getTodo, updateTodo } from "@/lib/db";
import { TodoInputSchema } from "@/lib/schema";
import { parseId, parseJsonBody, serverError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const todo = await getTodo(id);
    if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ todo });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Failed to load todo");
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const parsed = await parseJsonBody(req, TodoInputSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const todo = await updateTodo(id, parsed.data);
    if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ todo });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Failed to update todo");
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const deleted = await deleteTodo(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Failed to delete todo");
  }
}
