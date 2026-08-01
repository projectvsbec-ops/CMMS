"use client";

import React, { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { useWorkTasks, useBulkUpdateWorkTasks, useUpdateWorkTask, useDeleteWorkTask } from "../queries";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, AlertCircle, Trash2, CheckCircle2, XCircle } from "lucide-react";
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
  const { data: rawTasks, isLoading } = useWorkTasks(filters);
  const bulkUpdateMutation = useBulkUpdateWorkTasks();
  const updateMutation = useUpdateWorkTask();
  const deleteMutation = useDeleteWorkTask();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<WorkTaskWithRelations | null>(null);

  // Sort tasks by priority (critical > high > medium > low) and then by created_at (newest first)
  const tasks = React.useMemo(() => {
    if (!rawTasks) return [];
    
    const priorityWeight = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...rawTasks].sort((a, b) => {
      const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (weightDiff !== 0) return weightDiff;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [rawTasks]);

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

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteMutation.mutateAsync(taskToDelete.id);
      toast.add({ title: "Task Deleted", description: "The work task has been deleted permanently." });
    } catch (e) {
      toast.add({ title: "Error", description: "Failed to delete task.", type: "error" });
    } finally {
      setTaskToDelete(null);
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
      key: "manager",
      header: "Manager",
      cell: (item) => item.manager ? (
        <div className="text-sm">
          <p>{item.manager.name}</p>
          <p className="text-xs text-muted-foreground">{item.manager.employee_id || "No ID"}</p>
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
    {
      key: "created_at",
      header: "Created",
      cell: (item) => format(new Date(item.created_at), "MMM dd, yyyy"),
    },
  ];

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border-primary/20 border rounded-lg p-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium ml-2 text-primary">{selectedIds.length} tasks selected</span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                Change Status
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
              <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                Change Priority
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

      <div className="hidden md:block">
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
              icon: <XCircle className="h-4 w-4" />,
              onClick: () => handleQuickAction(item, "cancelled", "Quick cancelled task"),
            }] : []),
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setTaskToDelete(item),
              destructive: true,
            }
          ]}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No tasks found matching your filters.</div>
        ) : (
          tasks.map(item => {
            const isOverdue = item.target_date && isPast(new Date(item.target_date)) && !isToday(new Date(item.target_date)) && item.status !== "completed" && item.status !== "cancelled";
            
            return (
              <div 
                key={item.id} 
                className="bg-card border rounded-xl p-4 shadow-sm space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => onViewTask(item)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{item.task_number}</span>
                      <StatusBadge type="priority" value={item.priority} />
                    </div>
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge type="task" value={item.status} />
                    {isOverdue && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 uppercase">
                        <AlertCircle className="h-3 w-3 mr-1" /> Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Location</p>
                    <p>{item.department?.name || "-"}</p>
                    <p className="truncate max-w-[120px]">{item.area?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Manager</p>
                    <p>{item.manager?.name || "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Created Date</p>
                    <p>{format(new Date(item.created_at), "MMM dd")}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Target Date</p>
                    <p>{item.target_date ? format(new Date(item.target_date), "MMM dd") : "-"}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t mt-3">
                  {item.status !== "completed" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border-emerald-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction(item, "completed", "Quick marked task as completed");
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Complete
                    </Button>
                  )}
                  {item.status !== "cancelled" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs text-muted-foreground hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction(item, "cancelled", "Quick cancelled task");
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Cancel
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(item);
                    }}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete(item);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title="Delete Work Task"
        description={`Are you sure you want to delete task ${taskToDelete?.task_number}? This action cannot be undone.`}
        confirmLabel="Delete Task"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
