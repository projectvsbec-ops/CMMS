import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTaskCategories,
  getWorkTasks,
  getWorkTaskById,
  createWorkTask,
  updateWorkTask,
  bulkUpdateWorkTasks,
  deleteWorkTask,
  getDashboardStats,
  WorkTaskFilters,
} from "./api";
import { logActivity } from "@/features/activity-logs/api";
import type { WorkTaskInsert } from "@/types";

export const workKeys = {
  all: ["work"] as const,
  categories: () => [...workKeys.all, "categories"] as const,
  tasks: (filters?: WorkTaskFilters) => [...workKeys.all, "tasks", filters] as const,
  task: (id: string) => [...workKeys.all, "task", id] as const,
  dashboard: () => [...workKeys.all, "dashboardStats"] as const,
};

export function useTaskCategories() {
  return useQuery({
    queryKey: workKeys.categories(),
    queryFn: () => getTaskCategories(),
  });
}

export function useWorkTasks(filters?: WorkTaskFilters) {
  return useQuery({
    queryKey: workKeys.tasks(filters),
    queryFn: () => getWorkTasks(filters),
  });
}

export function useWorkTask(id: string) {
  return useQuery({
    queryKey: workKeys.task(id),
    queryFn: () => getWorkTaskById(id),
    enabled: !!id,
  });
}

export function useCreateWorkTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: WorkTaskInsert) => {
      const data = await createWorkTask(task);
      logActivity({
        action: "Created Task",
        entity_type: "work_tasks",
        entity_id: data.id,
        description: `Created new task: ${data.title}`,
        metadata: { title: data.title },
      }).catch(console.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.all });
    },
  });
}

export function useUpdateWorkTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, logMessage }: { id: string; updates: Partial<WorkTaskInsert>; logMessage?: string }) => {
      const data = await updateWorkTask(id, updates);
      
      const message = logMessage || "Updated task details";
      logActivity({
        action: "Updated Task",
        entity_type: "work_tasks",
        entity_id: id,
        description: message,
        metadata: updates,
      }).catch(console.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workKeys.all });
    },
  });
}

export function useBulkUpdateWorkTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates, actionName }: { ids: string[]; updates: Partial<WorkTaskInsert>; actionName: string }) => {
      const data = await bulkUpdateWorkTasks(ids, updates);
      
      logActivity({
        action: `Bulk ${actionName}`,
        entity_type: "work_tasks",
        entity_id: null,
        description: `Bulk updated ${ids.length} tasks`,
        metadata: { count: ids.length, updates },
      }).catch(console.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.all });
    },
  });
}

export function useDeleteWorkTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const data = await deleteWorkTask(id);
      
      logActivity({
        action: "Deleted Task",
        entity_type: "work_tasks",
        entity_id: id,
        description: "Deleted a work task",
        metadata: { deleted: true },
      }).catch(console.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.all });
    },
  });
}

export function useWorkDashboardStats() {
  return useQuery({
    queryKey: workKeys.dashboard(),
    queryFn: () => getDashboardStats(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 mins automatically
  });
}
