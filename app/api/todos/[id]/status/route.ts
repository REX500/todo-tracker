import { NextResponse } from "next/server";
import { setTodoStatus } from "@/lib/db";
import { TodoStatusPatchSchema } from "@/lib/schema";
import { parseId, parseJsonBody, serverError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const parsed = await parseJsonBody(req, TodoStatusPatchSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const todo = await setTodoStatus(id, parsed.data.status);
    if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ todo });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Failed to update status");
  }
}
