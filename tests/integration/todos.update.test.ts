import { POST } from "@/app/api/todos/route";
import { PUT, DELETE, GET } from "@/app/api/todos/[id]/route";
import { describeWithDb, resetDb } from "./helpers/db";

async function createTodo(): Promise<number> {
  const res = await POST(
    new Request("http://test/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "Seed" })
    })
  );
  const body = await res.json();
  return body.todo.id as number;
}

describeWithDb("PUT /api/todos/[id]", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("updates an existing todo", async () => {
    const id = await createTodo();
    const req = new Request(`http://test/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "Updated", status: "In Progress", tag: "Work" })
    });
    const res = await PUT(req, { params: { id: String(id) } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.todo).toMatchObject({ task: "Updated", status: "In Progress", tag: "Work" });
  });

  it("returns 404 for unknown id", async () => {
    const req = new Request("http://test/api/todos/999999", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "x" })
    });
    const res = await PUT(req, { params: { id: "999999" } });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const req = new Request("http://test/api/todos/abc", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "x" })
    });
    const res = await PUT(req, { params: { id: "abc" } });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid body", async () => {
    const id = await createTodo();
    const req = new Request(`http://test/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "" })
    });
    const res = await PUT(req, { params: { id: String(id) } });
    expect(res.status).toBe(400);
  });
});

describeWithDb("GET /api/todos/[id]", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns the todo", async () => {
    const id = await createTodo();
    const res = await GET(new Request(`http://test/api/todos/${id}`), { params: { id: String(id) } });
    expect(res.status).toBe(200);
    expect((await res.json()).todo.id).toBe(id);
  });

  it("returns 404 for unknown id", async () => {
    const res = await GET(new Request("http://test/api/todos/999999"), { params: { id: "999999" } });
    expect(res.status).toBe(404);
  });
});

describeWithDb("DELETE /api/todos/[id]", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("deletes the todo and returns 200", async () => {
    const id = await createTodo();
    const res = await DELETE(new Request(`http://test/api/todos/${id}`, { method: "DELETE" }), {
      params: { id: String(id) }
    });
    expect(res.status).toBe(200);
    const after = await GET(new Request(`http://test/api/todos/${id}`), { params: { id: String(id) } });
    expect(after.status).toBe(404);
  });

  it("returns 404 when the todo doesn't exist", async () => {
    const res = await DELETE(new Request("http://test/api/todos/999999", { method: "DELETE" }), {
      params: { id: "999999" }
    });
    expect(res.status).toBe(404);
  });
});
