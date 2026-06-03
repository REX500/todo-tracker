import { POST as CREATE_POST } from "@/app/api/todos/route";
import { POST as IMPORT_POST } from "@/app/api/todos/import/route";
import { GET as LIST_GET } from "@/app/api/todos/route";
import { describeWithDb, resetDb } from "./helpers/db";

function importReq(body: unknown): Request {
  return new Request("http://test/api/todos/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describeWithDb("POST /api/todos/import", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("imports an array of valid legacy todos", async () => {
    const res = await IMPORT_POST(
      importReq({
        todos: [
          { task: "Imported one", status: "To Do" },
          { task: "Imported two", tag: "Work", deadline: "2026-12-31" }
        ]
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).inserted).toBe(2);

    const list = await LIST_GET();
    const body = await list.json();
    expect(body.todos.map((t: { task: string }) => t.task).sort()).toEqual(["Imported one", "Imported two"]);
  });

  it("rejects the whole batch when any item is invalid", async () => {
    // First, seed a row so we can confirm nothing new was written.
    await CREATE_POST(
      new Request("http://test/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "Existing" })
      })
    );

    const res = await IMPORT_POST(
      importReq({
        todos: [
          { task: "Valid" },
          { task: "" } // invalid — empty task
        ]
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid todo at index 1/);

    const list = await LIST_GET();
    const after = await list.json();
    expect(after.todos.map((t: { task: string }) => t.task)).toEqual(["Existing"]);
  });

  it("rejects a payload missing the `todos` array", async () => {
    const res = await IMPORT_POST(importReq({}));
    expect(res.status).toBe(400);
  });

  it("accepts an empty array as a no-op", async () => {
    const res = await IMPORT_POST(importReq({ todos: [] }));
    expect(res.status).toBe(200);
    expect((await res.json()).inserted).toBe(0);
  });
});
