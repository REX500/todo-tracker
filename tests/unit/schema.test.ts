import { TodoInputSchema, TodoStatusPatchSchema, TodoImportSchema, StatusSchema } from "@/lib/schema";

describe("StatusSchema", () => {
  it("accepts the three statuses", () => {
    expect(StatusSchema.parse("To Do")).toBe("To Do");
    expect(StatusSchema.parse("In Progress")).toBe("In Progress");
    expect(StatusSchema.parse("Done")).toBe("Done");
  });
  it("rejects unknown statuses", () => {
    expect(StatusSchema.safeParse("Blocked").success).toBe(false);
  });
});

describe("TodoInputSchema", () => {
  it("requires a non-empty task", () => {
    expect(TodoInputSchema.safeParse({ task: "" }).success).toBe(false);
    expect(TodoInputSchema.safeParse({}).success).toBe(false);
  });

  it("defaults status to 'To Do'", () => {
    const result = TodoInputSchema.parse({ task: "Write tests" });
    expect(result.status).toBe("To Do");
  });

  it("transforms empty/whitespace optional strings to null", () => {
    const result = TodoInputSchema.parse({
      task: "Walk the dog",
      tag: "   ",
      stakeholder: "",
      url: "",
      notes: ""
    });
    expect(result.tag).toBeNull();
    expect(result.stakeholder).toBeNull();
    expect(result.url).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("preserves trimmed values", () => {
    const result = TodoInputSchema.parse({
      task: "  Walk the dog  ",
      tag: " Errands ",
      stakeholder: "Filip",
      notes: " details "
    });
    expect(result.task).toBe("Walk the dog");
    expect(result.tag).toBe("Errands");
    expect(result.stakeholder).toBe("Filip");
    expect(result.notes).toBe("details");
  });

  it("accepts a valid YYYY-MM-DD deadline and rejects malformed ones", () => {
    expect(TodoInputSchema.parse({ task: "t", deadline: "2026-06-15" }).deadline).toBe("2026-06-15");
    expect(TodoInputSchema.parse({ task: "t", deadline: "" }).deadline).toBeNull();
    expect(TodoInputSchema.safeParse({ task: "t", deadline: "15/06/2026" }).success).toBe(false);
    expect(TodoInputSchema.safeParse({ task: "t", deadline: "2026-6-15" }).success).toBe(false);
  });

  it("rejects invalid status values", () => {
    expect(TodoInputSchema.safeParse({ task: "t", status: "Maybe" }).success).toBe(false);
  });
});

describe("TodoStatusPatchSchema", () => {
  it("accepts a known status only", () => {
    expect(TodoStatusPatchSchema.parse({ status: "Done" }).status).toBe("Done");
    expect(TodoStatusPatchSchema.safeParse({ status: "Maybe" }).success).toBe(false);
    expect(TodoStatusPatchSchema.safeParse({}).success).toBe(false);
  });
});

describe("TodoImportSchema", () => {
  it("accepts an array of legacy todos with extra fields", () => {
    const result = TodoImportSchema.parse({
      todos: [
        { task: "a", status: "To Do" },
        { task: "b", tag: "Work", id: 12345, createdAt: "1/1/2026" }
      ]
    });
    expect(result.todos).toHaveLength(2);
  });

  it("rejects items missing a task", () => {
    expect(TodoImportSchema.safeParse({ todos: [{ status: "To Do" }] }).success).toBe(false);
  });

  it("requires a todos array", () => {
    expect(TodoImportSchema.safeParse({}).success).toBe(false);
  });
});
