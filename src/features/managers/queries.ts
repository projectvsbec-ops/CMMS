import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getManagers, getManager, createManager, updateManager, deleteManager } from "./api";
import { toast } from "@/components/ui/toast";
import type { ManagerInsert, ManagerUpdate } from "@/types";

export const managerKeys = {
  all: ["managers"] as const,
  lists: () => [...managerKeys.all, "list"] as const,
  list: (departmentId?: string) => [...managerKeys.lists(), { departmentId }] as const,
  details: () => [...managerKeys.all, "detail"] as const,
  detail: (id: string) => [...managerKeys.details(), id] as const,
};

export function useManagers(departmentId?: string) {
  return useQuery({
    queryKey: managerKeys.list(departmentId),
    queryFn: () => getManagers(departmentId),
  });
}

export function useManager(id: string) {
  return useQuery({
    queryKey: managerKeys.detail(id),
    queryFn: () => getManager(id),
    enabled: !!id,
  });
}

export function useCreateManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.lists() });
    },
    onError: (error) => {
      toast.add({
        title: "Failed to create manager",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function useUpdateManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ManagerUpdate }) => updateManager(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: managerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: managerKeys.detail(data.id) });
    },
    onError: (error) => {
      toast.add({
        title: "Failed to update manager",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function useDeleteManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.lists() });
    },
    onError: (error) => {
      toast.add({
        title: "Failed to delete manager",
        description: "Cannot delete manager if they are assigned to existing work tasks.",
        type: "error",
      });
    },
  });
}
