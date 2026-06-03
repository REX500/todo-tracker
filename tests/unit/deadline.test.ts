import { deadlineStatus, fmtDeadline } from "@/lib/deadline";

function iso(daysFromToday: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("deadlineStatus", () => {
  it("returns '' when there is no deadline", () => {
    expect(deadlineStatus(null, "To Do")).toBe("");
    expect(deadlineStatus("", "To Do")).toBe("");
  });

  it("returns '' when status is Done", () => {
    expect(deadlineStatus(iso(-5), "Done")).toBe("");
    expect(deadlineStatus(iso(2), "Done")).toBe("");
  });

  it("returns 'overdue' for past dates", () => {
    expect(deadlineStatus(iso(-1), "To Do")).toBe("overdue");
    expect(deadlineStatus(iso(-30), "In Progress")).toBe("overdue");
  });

  it("returns 'soon' for today and tomorrow", () => {
    expect(deadlineStatus(iso(0), "To Do")).toBe("soon");
    expect(deadlineStatus(iso(1), "In Progress")).toBe("soon");
  });

  it("returns 'ok' for two or more days away", () => {
    expect(deadlineStatus(iso(2), "To Do")).toBe("ok");
    expect(deadlineStatus(iso(30), "In Progress")).toBe("ok");
  });
});

describe("fmtDeadline", () => {
  it("returns an empty string when no deadline", () => {
    expect(fmtDeadline(null)).toBe("");
    expect(fmtDeadline("")).toBe("");
  });

  it("returns a non-empty locale-formatted string for a valid date", () => {
    expect(fmtDeadline("2026-06-15").length).toBeGreaterThan(0);
  });
});
