import { POST as LOGIN_POST } from "@/app/api/auth/login/route";
import { POST as LOGOUT_POST } from "@/app/api/auth/logout/route";
import { sessionCookieName } from "@/lib/auth";

function loginReq(body: unknown): Request {
  return new Request("http://test/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/auth/login", () => {
  it("rejects wrong credentials with 401", async () => {
    const res = await LOGIN_POST(loginReq({ username: "nope", password: "nope" }));
    expect(res.status).toBe(401);
  });

  it("400s on missing credentials", async () => {
    const res = await LOGIN_POST(loginReq({}));
    expect(res.status).toBe(400);
  });

  it("400s on invalid JSON", async () => {
    const req = new Request("http://test/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json"
    });
    const res = await LOGIN_POST(req);
    expect(res.status).toBe(400);
  });

  it("sets a session cookie on success", async () => {
    const res = await LOGIN_POST(
      loginReq({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD })
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(`${sessionCookieName()}=`);
    expect(setCookie).toContain("HttpOnly");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await LOGOUT_POST();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(`${sessionCookieName()}=`);
    expect(setCookie).toMatch(/Max-Age=0/);
  });
});
