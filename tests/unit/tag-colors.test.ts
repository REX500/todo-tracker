import { hashStr, tagColors } from "@/lib/tag-colors";

describe("hashStr", () => {
  it("returns the same value for the same input", () => {
    expect(hashStr("Design")).toBe(hashStr("Design"));
    expect(hashStr("")).toBe(hashStr(""));
  });

  it("returns a non-negative integer", () => {
    const v = hashStr("Backend");
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  });

  it("produces different values for clearly different strings", () => {
    expect(hashStr("Design")).not.toBe(hashStr("Backend"));
    expect(hashStr("a")).not.toBe(hashStr("b"));
  });
});

describe("tagColors", () => {
  it("is case-insensitive (same hue for Design / design / DESIGN)", () => {
    const a = tagColors("Design");
    const b = tagColors("design");
    const c = tagColors("DESIGN");
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it("returns three HSL strings", () => {
    const c = tagColors("Errands");
    expect(c.color).toMatch(/^hsl\(\d+(\.\d+)?, 75%, 70%\)$/);
    expect(c.background).toMatch(/^hsl\(\d+(\.\d+)?, 50%, 14%\)$/);
    expect(c.border).toMatch(/^hsl\(\d+(\.\d+)?, 45%, 28%\)$/);
  });

  it("produces different colors for two arbitrary distinct tags", () => {
    const a = tagColors("Design");
    const b = tagColors("Backend");
    expect(a.color).not.toBe(b.color);
  });
});
