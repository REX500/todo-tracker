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

export function parseDeadline(deadline: string): Date | undefined {
  if (!deadline) return undefined;
  const date = new Date(`${deadline}T00:00:00`);
  return isNaN(date.getTime()) ? undefined : date;
}

export function toDeadlineString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fmtDeadline(deadline: string | null): string {
  if (!deadline) return "";
  return new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
