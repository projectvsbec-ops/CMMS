"use client";

import { useWorkTasks } from "@/features/work/queries";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import type { WorkTaskWithRelations } from "@/types";

interface DepartmentWorkAllocatedProps {
  departmentId: string;
}

export function DepartmentWorkAllocated({ departmentId }: DepartmentWorkAllocatedProps) {
  const { data: tasks, isLoading } = useWorkTasks({ departmentId });

  const columns: DataTableColumn<WorkTaskWithRelations>[] = [
    {
      key: "sno",
      header: "S.No",
      cell: (_, index) => index + 1,
      className: "w-12 text-center",
    },
    {
      key: "nature_of_work",
      header: "Nature of Work",
      cell: (item) => (
        <div>
          <p className="font-medium">{item.title}</p>
          {item.area && <p className="text-xs text-muted-foreground">{item.area.name}</p>}
        </div>
      ),
    },
    {
      key: "identified_by",
      header: "Identified By",
      cell: (item) => item.identified_by || "-",
    },
    {
      key: "target_date",
      header: "Target Date",
      cell: (item) => item.target_date ? format(new Date(item.target_date), "MMM dd, yyyy") : "-",
    },
    {
      key: "completed_status",
      header: "Completed Status",
      cell: (item) => <StatusBadge type="task" value={item.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Allocated Work Tasks</h3>
      <DataTable
        data={tasks || []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No work tasks allocated for this department."
      />
    </div>
  );
}
