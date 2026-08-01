"use client";

import { useMemo } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useWorkTasks, useUpdateWorkTask } from "../queries";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { format, isPast, isToday } from "date-fns";
import { AlertCircle, Clock, MapPin, User } from "lucide-react";
import type { WorkTaskWithRelations } from "@/types";
import type { WorkTaskFilters } from "@/features/work/api";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const KANBAN_COLUMNS = [
  { id: "pending", title: "Pending" },
  { id: "assigned", title: "Assigned" },
  { id: "in_progress", title: "In Progress" },
  { id: "on_hold", title: "On Hold" },
  { id: "completed", title: "Completed" },
];

interface KanbanBoardProps {
  filters: WorkTaskFilters;
  onEditTask: (task: WorkTaskWithRelations) => void;
  onViewTask: (task: WorkTaskWithRelations) => void;
}

export function KanbanBoard({ filters, onViewTask }: KanbanBoardProps) {
  const { data: tasks, isLoading } = useWorkTasks(filters);
  const updateMutation = useUpdateWorkTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag distance before firing
      },
    })
  );

  const columns = useMemo(() => {
    if (!tasks) return {};
    const cols: Record<string, WorkTaskWithRelations[]> = {};
    KANBAN_COLUMNS.forEach(c => cols[c.id] = []);
    
    tasks.forEach(t => {
      if (cols[t.status]) {
        cols[t.status].push(t);
      } else {
        // Fallback for cancelled or unexpected statuses
        if (!cols["pending"]) cols["pending"] = [];
        cols["pending"].push(t);
      }
    });
    return cols;
  }, [tasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const fromStatus = active.data.current?.sortable?.containerId;
    const toStatus = over.data.current?.sortable?.containerId || over.id; // It could be dropped on another item or empty column

    if (!fromStatus || !toStatus || fromStatus === toStatus) return;

    const validStatus = KANBAN_COLUMNS.find(c => c.id === toStatus)?.id;
    if (!validStatus) return;

    try {
      await updateMutation.mutateAsync({
        id: taskId,
        updates: { status: validStatus as any },
        logMessage: `Moved task to ${validStatus} via Kanban board`
      });
      // The optimistic update or refetch will re-render it naturally.
    } catch (e) {
      toast.add({ title: "Move Failed", description: "Could not update task status.", type: "error" });
    }
  };

  if (isLoading) {
    return <div className="h-[500px] flex items-center justify-center text-muted-foreground">Loading board...</div>;
  }

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto pb-4 pt-2">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragEnd={handleDragEnd}
      >
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn 
            key={col.id} 
            id={col.id} 
            title={col.title} 
            tasks={columns[col.id] || []} 
            onViewTask={onViewTask}
          />
        ))}
      </DndContext>
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function KanbanColumn({ id, title, tasks, onViewTask }: { id: string; title: string; tasks: WorkTaskWithRelations[]; onViewTask: (t: WorkTaskWithRelations) => void }) {
  const { setNodeRef } = useSortable({
    id,
    data: { type: "Column", id },
  });

  return (
    <div className="flex flex-col w-[320px] shrink-0 bg-muted/40 rounded-xl border p-3 h-fit max-h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
        <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
      </div>
      
      <div 
        ref={setNodeRef}
        className="flex flex-col gap-3 min-h-[150px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} onClick={() => onViewTask(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function KanbanCard({ task, onClick }: { task: WorkTaskWithRelations; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.target_date && isPast(new Date(task.target_date)) && !isToday(new Date(task.target_date)) && task.status !== "completed" && task.status !== "cancelled";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none select-none",
        isDragging && "opacity-50"
      )}
    >
      <Card className="hover:border-primary/50 transition-colors bg-card shadow-sm border">
        <CardContent className="p-3 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {task.task_number}
            </span>
            <StatusBadge type="priority" value={task.priority} />
          </div>
          
          <h4 className="text-sm font-semibold leading-tight line-clamp-2">{task.title}</h4>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{task.department?.name} • {task.area?.name || "No Area"}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{task.manager?.name || "Unassigned"}</span>
              </div>
              
              {task.target_date && (
                <div className={cn("flex items-center gap-1 whitespace-nowrap", isOverdue && "text-destructive font-medium")}>
                  {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  <span>{format(new Date(task.target_date), "MMM dd")}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
