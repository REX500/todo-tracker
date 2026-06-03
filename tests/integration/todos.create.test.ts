import { POST } from "@/app/api/todos/route";
import { describeWithDb, resetDb } from "./helpers/db";

function jsonReq(body: unknown): Request {
  return new Request("http://test/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describeWithDb("POST /api/todos", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a minimal todo and returns 201 with defaults", async () => {
    const res = await POST(jsonReq({ task: "Write tests" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.todo.task).toBe("Write tests");
    expect(body.todo.status).toBe("To Do");
    expect(body.todo.tag).toBeNull();
    expect(body.todo.deadline).toBeNull();
    expect(typeof body.todo.id).toBe("number");
  });

  it("persists optional fields", async () => {
    const res = await POST(
      jsonReq({
        task: "Ship PR",
        status: "In Progress",
        tag: "Work",
        stakeholder: "Filip",
        deadline: "2026-12-31",
        url: "https://github.com/example",
        notes: "blocker: needs review"
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.todo).toMatchObject({
      task: "Ship PR",
      status: "In Progress",
      tag: "Work",
      stakeholder: "Filip",
      deadline: "2026-12-31",
      url: "https://github.com/example",
      notes: "blocker: needs review"
    });
  });

  it("rejects an empty task with 400", async () => {
    const res = await POST(jsonReq({ task: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid");
  });

  it("rejects an unknown status with 400", async () => {
    const res = await POST(jsonReq({ task: "x", status: "Maybe" }));
    expect(res.status).toBe(400);
  });

  it("rejects malformed deadline with 400", async () => {
    const res = await POST(jsonReq({ task: "x", deadline: "31/12/2026" }));
    expect(res.status).toBe(400);
  });

  it("rejects non-JSON body with 400", async () => {
    const req = new Request("http://test/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json"
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
