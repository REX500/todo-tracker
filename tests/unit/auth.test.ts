import { createSessionToken, verifySessionToken, checkCredentials } from "@/lib/auth";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.AUTH_SECRET = "test-auth-secret-must-be-long-enough-1234567890";
  process.env.ADMIN_USERNAME = "filip";
  process.env.ADMIN_PASSWORD = "swordfish";
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("session token", () => {
  it("signs and verifies a round-trip", async () => {
    const token = await createSessionToken("filip");
    const session = await verifySessionToken(token);
    expect(session).toEqual({ username: "filip" });
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken("filip");
    const tampered = token.slice(0, -2) + "AB";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySessionToken("not-a-token")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
  });

  it("throws when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    await expect(createSessionToken("filip")).rejects.toThrow(/AUTH_SECRET/);
  });
});

describe("checkCredentials", () => {
  it("returns true for the configured credentials", () => {
    expect(checkCredentials("filip", "swordfish")).toBe(true);
  });
  it("rejects wrong username", () => {
    expect(checkCredentials("bob", "swordfish")).toBe(false);
  });
  it("rejects wrong password", () => {
    expect(checkCredentials("filip", "wrong")).toBe(false);
  });
  it("returns false when env vars are unset", () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    expect(checkCredentials("filip", "swordfish")).toBe(false);
  });
});
