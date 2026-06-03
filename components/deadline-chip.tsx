import { Calendar } from "lucide-react";
import { deadlineStatus, fmtDeadline, type DeadlineStatus } from "@/lib/deadline";
import type { Status } from "@/lib/schema";

interface Props {
  deadline: string | null;
  status: Status;
}

const styles: Record<Exclude<DeadlineStatus, "">, string> = {
  overdue: "bg-[hsl(0_70%_60%/0.18)] text-[hsl(0_80%_72%)] border-[hsl(0_70%_60%/0.4)] pulse-red",
  soon: "bg-[hsl(33_86%_53%/0.15)] text-[hsl(33_86%_60%)] border-[hsl(33_86%_53%/0.35)]",
  ok: "bg-secondary text-muted-foreground border-border"
};

export function DeadlineChip({ deadline, status }: Props) {
  const ds = deadlineStatus(deadline, status);
  if (!deadline || ds === "") return null;
  const label = ds === "overdue" ? "Overdue · " : ds === "soon" ? "Due soon · " : "";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.72rem] font-bold ${styles[ds]}`}
    >
      <Calendar className="h-3 w-3" strokeWidth={2.5} />
      {label}
      {fmtDeadline(deadline)}
    </span>
  );
}
