import { POST } from "@/app/api/todos/route";
import { PATCH } from "@/app/api/todos/[id]/status/route";
import { describeWithDb, resetDb } from "./helpers/db";

async function createTodo(task = "Seed"): Promise<number> {
  const res = await POST(
    new Request("http://test/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })
    })
  );
  return (await res.json()).todo.id as number;
}

describeWithDb("PATCH /api/todos/[id]/status", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("updates the status", async () => {
    const id = await createTodo();
    const req = new Request(`http://test/api/todos/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" })
    });
    const res = await PATCH(req, { params: { id: String(id) } });
    expect(res.status).toBe(200);
    expect((await res.json()).todo.status).toBe("Done");
  });

  it("rejects an unknown status", async () => {
    const id = await createTodo();
    const req = new Request(`http://test/api/todos/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Maybe" })
    });
    const res = await PATCH(req, { params: { id: String(id) } });
    expect(res.status).toBe(400);
  });

  it("404s on unknown id", async () => {
    const req = new Request("http://test/api/todos/999999/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" })
    });
    const res = await PATCH(req, { params: { id: "999999" } });
    expect(res.status).toBe(404);
  });

  it("400s on invalid id", async () => {
    const req = new Request("http://test/api/todos/abc/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" })
    });
    const res = await PATCH(req, { params: { id: "abc" } });
    expect(res.status).toBe(400);
  });
});
