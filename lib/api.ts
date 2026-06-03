import { NextResponse } from "next/server";
import type { ZodTypeAny, z } from "zod";

export async function parseJsonBody<S extends ZodTypeAny>(
  req: Request,
  schema: S
): Promise<{ ok: true; data: z.output<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid", issues: result.error.issues },
        { status: 400 }
      )
    };
  }
  return { ok: true, data: result.data };
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}
