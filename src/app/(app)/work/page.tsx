"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { WorkListView } from "@/features/work/components/work-list-view";
import { KanbanBoard } from "@/features/work/components/kanban-board";
import { WorkTaskForm } from "@/features/work/components/work-task-form";
import { SearchInput } from "@/components/shared/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, LayoutList, Kanban } from "lucide-react";
import { useDepartments } from "@/features/departments/queries";
import { useWorkers } from "@/features/workers/queries";
import { useTaskCategories } from "@/features/work/queries";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { WorkTaskWithRelations } from "@/types";
import type { WorkTaskFilters } from "@/features/work/api";

export default function WorkManagementPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<WorkTaskFilters>({});
  const [view, setView] = useState<"list" | "kanban">("list");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<WorkTaskWithRelations | null>(null);

  const { data: departments } = useDepartments();
  const { data: workers } = useWorkers();
  const { data: categories } = useTaskCategories();

  const handleFilterChange = (key: keyof WorkTaskFilters, value: any) => {
    setFilters((prev: WorkTaskFilters) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const openCreateForm = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  const openEditForm = (task: WorkTaskWithRelations) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const navigateToDetails = (task: WorkTaskWithRelations) => {
    router.push(`/work/${task.id}`);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)]">
      <PageHeader
        title="Work Allocation"
        description="Manage maintenance tasks and worker assignments."
        action={{
          label: "Create Task",
          onClick: openCreateForm,
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-muted/30 rounded-lg border shrink-0 overflow-x-auto">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            placeholder="Search task or title..."
            value={filters.search || ""}
            onValueChange={(val) => handleFilterChange("search", val)}
            className="w-full bg-background"
          />
        </div>
        
        {view === "list" && (
          <div className="w-[140px] shrink-0">
            <Select value={filters.status || "all"} onValueChange={(val) => handleFilterChange("status", val)}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TASK_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-[140px] shrink-0">
          <Select value={filters.priority || "all"} onValueChange={(val) => handleFilterChange("priority", val)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {TASK_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[140px] shrink-0">
          <Select value={filters.departmentId || "all"} onValueChange={(val) => handleFilterChange("departmentId", val)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              {departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[140px] shrink-0">
          <Select value={filters.workerId || "all"} onValueChange={(val) => handleFilterChange("workerId", val)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Worker" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workers</SelectItem>
              {workers?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      <Tabs 
        value={view} 
        onValueChange={(v) => setView(v as "list" | "kanban")} 
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center mb-2 shrink-0">
          <TabsList>
            <TabsTrigger value="list" className="gap-2"><LayoutList className="h-4 w-4" /> List</TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2"><Kanban className="h-4 w-4" /> Kanban</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list" className="flex-1 m-0 border-none p-0 overflow-y-auto">
          <WorkListView 
            filters={filters} 
            onEditTask={openEditForm}
            onViewTask={navigateToDetails}
          />
        </TabsContent>
        
        <TabsContent value="kanban" className="flex-1 m-0 border-none p-0 overflow-hidden">
          <KanbanBoard 
            filters={filters}
            onEditTask={openEditForm}
            onViewTask={navigateToDetails}
          />
        </TabsContent>
      </Tabs>

      <WorkTaskForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        task={taskToEdit} 
      />
    </div>
  );
}
