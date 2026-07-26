import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
} from "./api";
import { logActivity } from "@/features/activity-logs/api";
import type { DepartmentInsert } from "@/types";

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (filters: string) => [...departmentKeys.lists(), { filters }] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: getDepartments,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartment(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      logActivity({
        action: "Created",
        entity_type: "department",
        entity_id: data.id,
        description: `Created department: ${data.name}`,
        metadata: { name: data.name },
      });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<DepartmentInsert> & { id: string }) =>
      updateDepartment(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      logActivity({
        action: "Updated",
        entity_type: "department",
        entity_id: data.id,
        description: `Updated department: ${data.name}`,
        metadata: { name: data.name },
      });
    },
  });
}
