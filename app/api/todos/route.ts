import { NextResponse } from "next/server";
import { createTodo, listTodos } from "@/lib/db";
import { TodoInputSchema } from "@/lib/schema";
import { parseJsonBody, serverError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const todos = await listTodos();
    return NextResponse.json({ todos }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load todos";
    return serverError(msg);
  }
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, TodoInputSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const todo = await createTodo(parsed.data);
    return NextResponse.json({ todo }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create todo";
    return serverError(msg);
  }
}
