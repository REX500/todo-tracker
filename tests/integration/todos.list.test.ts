import { GET, POST } from "@/app/api/todos/route";
import { describeWithDb, resetDb } from "./helpers/db";

describeWithDb("GET /api/todos", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns an empty list initially", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ todos: [] });
  });

  it("sends a no-store cache header so clients never read stale todos", async () => {
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns inserted todos ordered by created_at then id", async () => {
    for (const task of ["alpha", "beta", "gamma"]) {
      const req = new Request("http://test/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task })
      });
      await POST(req);
    }
    const res = await GET();
    const body = await res.json();
    expect(body.todos.map((t: { task: string }) => t.task)).toEqual(["alpha", "beta", "gamma"]);
  });
});
