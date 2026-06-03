import { z } from "zod";

export const StatusSchema = z.enum(["To Do", "In Progress", "Done"]);
export type Status = z.infer<typeof StatusSchema>;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null);

const optionalNullableString = (max: number) =>
  z.preprocess(
    emptyToNull,
    z.union([z.string().max(max), z.null()]).default(null)
  );

const optionalDeadline = z.preprocess(
  emptyToNull,
  z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be YYYY-MM-DD"), z.null()]).default(null)
);

export const TodoInputSchema = z.object({
  task: z.string().trim().min(1, "Task is required").max(500),
  status: StatusSchema.default("To Do"),
  tag: optionalNullableString(64),
  stakeholder: optionalNullableString(120),
  deadline: optionalDeadline,
  url: optionalNullableString(2000),
  notes: optionalNullableString(5000)
});

export type TodoInput = z.infer<typeof TodoInputSchema>;

export const TodoStatusPatchSchema = z.object({
  status: StatusSchema
});

export const LegacyTodoSchema = z
  .object({
    task: z.string().min(1),
    status: StatusSchema.optional(),
    tag: z.string().optional(),
    stakeholder: z.string().optional(),
    deadline: z.string().optional(),
    url: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.string().optional()
  })
  .passthrough();

export const TodoImportSchema = z.object({
  todos: z.array(LegacyTodoSchema).max(2000)
});
export type TodoImport = z.infer<typeof TodoImportSchema>;
