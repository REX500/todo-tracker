import type { Status } from "./schema";

export type DeadlineStatus = "" | "overdue" | "soon" | "ok";

export function deadlineStatus(deadline: string | null, status: Status): DeadlineStatus {
  if (!deadline || status === "Done") return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${deadline}T00:00:00`);
  if (isNaN(due.getTime())) return "";
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "soon";
  return "ok";
}

export function fmtDeadline(deadline: string | null): string {
  if (!deadline) return "";
  return new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
