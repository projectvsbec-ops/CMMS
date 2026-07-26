"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useWorkTask, useUpdateWorkTask } from "@/features/work/queries";
import { useEntityActivityLogs } from "@/features/activity-logs/queries";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Clock, CheckCircle2, User, MapPin, AlignLeft, CalendarDays, Package, Plus } from "lucide-react";
import { WorkTaskForm } from "@/features/work/components/work-task-form";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { useTaskInventoryTransactions, useInventoryItems } from "@/features/inventory/queries";
import { InventoryTransactionForm } from "@/features/inventory/components/inventory-transaction-form";
import type { InventoryTransactionWithRelations } from "@/types";

export default function WorkTaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { data: task, isLoading, error } = useWorkTask(taskId);
  const { data: logs } = useEntityActivityLogs(taskId);
  const { data: materials } = useTaskInventoryTransactions(taskId);
  const updateMutation = useUpdateWorkTask();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIssueMaterialOpen, setIsIssueMaterialOpen] = useState(false);

  // We need a way to select which item to issue. The InventoryTransactionForm takes an itemId.
  // Instead of building a complex item selector here, we can use a simple Select for the active items.
  const { data: allItems } = useInventoryItems({ status: "active" });
  const [selectedItemIdToIssue, setSelectedItemIdToIssue] = useState<string | null>(null);

  const handleOpenIssueModal = () => {
    // If we haven't selected an item yet, we will just open a mini-modal or something. 
    // Actually, let's just create a very simple "Select Item" state inside this component.
    setIsIssueMaterialOpen(true);
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold mb-2">Task Not Found</h2>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const markCompleted = async () => {
    try {
      await updateMutation.mutateAsync({
        id: task.id,
        updates: { status: "completed" },
        logMessage: "Marked task as completed from details page"
      });
      toast.add({ title: "Task Completed", description: "The task has been marked as completed." });
    } catch (e) {
      toast.add({ title: "Error", description: "Failed to update task.", type: "error" });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => router.push("/work")}>
          Work Allocation
        </span>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate max-w-[200px]">{task.task_number}</span>
      </div>

      <PageHeader
        title={task.title}
        description={`Task ${task.task_number} • Created on ${format(new Date(task.created_at), "PPP")}`}
      >
        <div className="flex gap-2">
          {task.status !== "completed" && task.status !== "cancelled" && (
            <Button onClick={markCompleted} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsFormOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Task
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlignLeft className="h-5 w-5 text-muted-foreground" />
                Task Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <StatusBadge type="priority" value={task.priority} />
                <StatusBadge type="task" value={task.status} />
                {task.category && (
                  <Badge variant="outline" className="border-primary/20 bg-primary/5">{task.category.name}</Badge>
                )}
              </div>

              {task.description && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> Location
                  </h4>
                  <p className="font-medium text-sm">{task.department?.name}</p>
                  {task.area && <p className="text-sm text-muted-foreground">{task.area.name}</p>}
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Assigned Worker
                  </h4>
                  {task.worker ? (
                    <div>
                      <p className="font-medium text-sm hover:underline cursor-pointer" onClick={() => router.push(`/workers/${task.worker_id}`)}>
                        {task.worker.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{task.worker.employee_id}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Unassigned</p>
                  )}
                </div>
              </div>

              {task.remarks && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Admin Remarks</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-md border border-dashed whitespace-pre-wrap">{task.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs && logs.length > 0 ? (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="mt-0.5 flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary/60 shrink-0" />
                        <div className="w-px h-full bg-border" />
                      </div>
                      <div className="pb-4">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-muted-foreground">{log.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(log.created_at), "PP p")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{format(new Date(task.created_at), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Target Date</span>
                <span className="font-medium">{task.target_date ? format(new Date(task.target_date), "MMM dd, yyyy") : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">{task.completed_date ? format(new Date(task.completed_date), "MMM dd, yyyy") : "-"}</span>
              </div>
              
              {task.identified_by && (
                <div className="pt-4 border-t mt-4">
                  <span className="text-xs text-muted-foreground block mb-1">Identified By</span>
                  <span className="text-sm font-medium">{task.identified_by}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materials Used Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                Materials Issued
              </CardTitle>
              {task.status !== "completed" && task.status !== "cancelled" && (
                <Button variant="outline" size="sm" onClick={handleOpenIssueModal} className="h-8">
                  <Plus className="h-3 w-3 mr-1" /> Issue Item
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isIssueMaterialOpen && !selectedItemIdToIssue && (
                <div className="mb-4 p-3 border rounded-md bg-muted/30 flex flex-col gap-2">
                  <span className="text-sm font-medium">Select an Item to Issue</span>
                  <div className="flex gap-2">
                    <select 
                      className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedItemIdToIssue(e.target.value);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select from inventory...</option>
                      {allItems?.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.current_stock} {i.unit} available)</option>
                      ))}
                    </select>
                    <Button variant="ghost" onClick={() => setIsIssueMaterialOpen(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {materials && materials.length > 0 ? (
                <div className="space-y-3 mt-3">
                  {materials.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{tx.item?.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "MMM dd, p")}</p>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {tx.quantity} {tx.item?.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mt-2">No materials issued for this task.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <WorkTaskForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        task={task} 
      />

      {selectedItemIdToIssue && (
        <InventoryTransactionForm
          open={!!selectedItemIdToIssue}
          onOpenChange={(v) => {
            if (!v) {
              setSelectedItemIdToIssue(null);
              setIsIssueMaterialOpen(false);
            }
          }}
          itemId={selectedItemIdToIssue}
          defaultType="stock_out"
          linkedTaskId={task.id}
        />
      )}
    </div>
  );
}
