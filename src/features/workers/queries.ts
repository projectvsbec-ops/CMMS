import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkers, getWorker, createWorker, updateWorker, createBulkWorkers, deleteWorker } from "./api";
import { logActivity } from "@/features/activity-logs/api";
import type { WorkerInsert } from "@/types";

export const workerKeys = {
  all: ["workers"] as const,
  lists: () => [...workerKeys.all, "list"] as const,
  list: (filters: string) => [...workerKeys.lists(), { filters }] as const,
  details: () => [...workerKeys.all, "detail"] as const,
  detail: (id: string) => [...workerKeys.details(), id] as const,
};

export function useWorkers() {
  return useQuery({
    queryKey: workerKeys.lists(),
    queryFn: getWorkers,
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: workerKeys.detail(id),
    queryFn: () => getWorker(id),
    enabled: !!id,
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorker,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
      logActivity({
        action: "Created",
        entity_type: "worker",
        entity_id: data.id,
        description: `Created worker: ${data.name} (${data.employee_id})`,
        metadata: { name: data.name, employee_id: data.employee_id },
      });
    },
  });
}

export function useBulkCreateWorkers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBulkWorkers,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
      logActivity({
        action: "Bulk Created",
        entity_type: "worker",
        entity_id: data?.[0]?.id || "bulk",
        description: `Bulk created ${data.length} workers`,
        metadata: { count: data.length },
      });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<WorkerInsert> & { id: string }) =>
      updateWorker(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
      logActivity({
        action: "Updated",
        entity_type: "worker",
        entity_id: data.id,
        description: `Updated worker: ${data.name} (${data.employee_id})`,
        metadata: { name: data.name, employee_id: data.employee_id },
      });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorker,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
      logActivity({
        action: "Deleted",
        entity_type: "worker",
        entity_id: id,
        description: `Deleted worker record`,
        metadata: { id },
      });
    },
  });
}
