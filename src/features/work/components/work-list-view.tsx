"use client";

import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { useWorkTasks, useBulkUpdateWorkTasks, useUpdateWorkTask } from "../queries";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { WorkTaskWithRelations, TaskStatus } from "@/types";
import type { WorkTaskFilters } from "@/features/work/api";
import { toast } from "@/components/ui/toast";

interface WorkListViewProps {
  filters: WorkTaskFilters;
  onEditTask: (task: WorkTaskWithRelations) => void;
  onViewTask: (task: WorkTaskWithRelations) => void;
}

export function WorkListView({ filters, onEditTask, onViewTask }: WorkListViewProps) {
  const { data: tasks, isLoading } = useWorkTasks(filters);
  const bulkUpdateMutation = useBulkUpdateWorkTasks();
  const updateMutation = useUpdateWorkTask();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleAll = (checked: boolean) => {
    if (!tasks) return;
    if (checked) {
      setSelectedIds(tasks.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkAction = async (action: string, updates: Partial<any>) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateMutation.mutateAsync({ ids: selectedIds, updates, actionName: action });
      setSelectedIds([]);
      toast.add({ title: "Bulk Action Successful", description: `Updated ${selectedIds.length} tasks.` });
    } catch (e) {
      toast.add({ title: "Error", description: "Bulk action failed.", type: "error" });
    }
  };

  const handleQuickAction = async (task: WorkTaskWithRelations, status: TaskStatus, logMessage: string) => {
    try {
      await updateMutation.mutateAsync({ id: task.id, updates: { status }, logMessage });
      toast.add({ title: "Status Updated", description: `${task.task_number} is now ${status}.` });
    } catch (e) {
      toast.add({ title: "Error", description: "Failed to update task.", type: "error" });
    }
  };

  const columns: DataTableColumn<WorkTaskWithRelations>[] = [
    {
      key: "select",
      header: <Checkbox 
        checked={tasks && tasks.length > 0 && selectedIds.length === tasks.length} 
        onCheckedChange={(c) => toggleAll(c as boolean)} 
      />,
      cell: (item) => <Checkbox 
        checked={selectedIds.includes(item.id)} 
        onCheckedChange={(c) => toggleOne(item.id, c as boolean)} 
        onClick={(e) => e.stopPropagation()}
      />,
      className: "w-10 pl-4",
      headerClassName: "w-10 pl-4"
    },
    {
      key: "task_number",
      header: "Task",
      cell: (item) => (
        <div>
          <span className="font-semibold cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onViewTask(item); }}>
            {item.task_number}
          </span>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.title}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (item) => (
        <div className="text-sm">
          <p>{item.department?.name || "-"}</p>
          <p className="text-xs text-muted-foreground">{item.area?.name || "-"}</p>
        </div>
      ),
    },
    {
      key: "worker",
      header: "Assigned To",
      cell: (item) => item.worker ? (
        <div className="text-sm">
          <p>{item.worker.name}</p>
          <p className="text-xs text-muted-foreground">{item.worker.employee_id}</p>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">Unassigned</span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (item) => <StatusBadge type="priority" value={item.priority} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => {
        const isOverdue = item.target_date && isPast(new Date(item.target_date)) && !isToday(new Date(item.target_date)) && item.status !== "completed" && item.status !== "cancelled";
        return (
          <div className="flex flex-col gap-1 items-start">
            <StatusBadge type="task" value={item.status} />
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 uppercase">
                <AlertCircle className="h-3 w-3 mr-1" /> Overdue
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "target_date",
      header: "Target",
      cell: (item) => item.target_date ? format(new Date(item.target_date), "MMM dd, yyyy") : "-",
    },
  ];

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border-primary/20 border rounded-lg p-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium ml-2 text-primary">{selectedIds.length} tasks selected</span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Change Status</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Status", { status: "pending" })}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Status", { status: "in_progress" })}>In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Status", { status: "completed" })}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Status", { status: "cancelled" })}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Change Priority</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Set Priority</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Priority", { priority: "low" })}>Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Priority", { priority: "medium" })}>Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Priority", { priority: "high" })}>High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Change Priority", { priority: "critical" })}>Critical</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <DataTable
        data={tasks || []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No tasks found matching your filters."
        onRowClick={(item) => onViewTask(item)}
        actions={(item) => [
          {
            label: "Edit",
            icon: <MoreHorizontal className="h-4 w-4" />,
            onClick: () => onEditTask(item),
          },
          ...(item.status !== "completed" ? [{
            label: "Mark Complete",
            icon: <CheckCircle2 className="h-4 w-4" />,
            onClick: () => handleQuickAction(item, "completed", "Quick marked task as completed"),
          }] : []),
          ...(item.status !== "cancelled" ? [{
            label: "Cancel",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => handleQuickAction(item, "cancelled", "Quick cancelled task"),
            destructive: true,
          }] : [])
        ]}
      />
    </div>
  );
}
