import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  WORKER_STATUSES,
  ATTENDANCE_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from "@/lib/constants";

type StatusType = "worker" | "attendance" | "task" | "priority";

interface StatusBadgeProps {
  type: StatusType;
  value: string;
  className?: string;
}

const STATUS_MAPS: Record<
  StatusType,
  ReadonlyArray<{ value: string; label: string; color: string }>
> = {
  worker: WORKER_STATUSES,
  attendance: ATTENDANCE_STATUSES,
  task: TASK_STATUSES,
  priority: TASK_PRIORITIES,
};

// Map color class to badge variant colors
const COLOR_VARIANTS: Record<string, string> = {
  "bg-emerald-500": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "bg-red-500": "bg-red-500/15 text-red-700 dark:text-red-400",
  "bg-amber-500": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-blue-500": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "bg-slate-400": "bg-slate-400/15 text-slate-600 dark:text-slate-400",
};

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const statusList = STATUS_MAPS[type];
  const status = statusList.find((s) => s.value === value);

  if (!status) {
    return (
      <Badge variant="outline" className={className}>
        {value}
      </Badge>
    );
  }

  const colorClasses = COLOR_VARIANTS[status.color] ?? "";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium border-0 text-xs",
        colorClasses,
        className
      )}
    >
      {status.label}
    </Badge>
  );
}
