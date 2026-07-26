import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAreas,
  getArea,
  createArea,
  updateArea,
} from "./api";
import { logActivity } from "@/features/activity-logs/api";
import type { AreaInsert } from "@/types";

export const areaKeys = {
  all: ["areas"] as const,
  lists: () => [...areaKeys.all, "list"] as const,
  list: (filters: string) => [...areaKeys.lists(), { filters }] as const,
  details: () => [...areaKeys.all, "detail"] as const,
  detail: (id: string) => [...areaKeys.details(), id] as const,
};

export function useAreas() {
  return useQuery({
    queryKey: areaKeys.lists(),
    queryFn: getAreas,
  });
}

export function useArea(id: string) {
  return useQuery({
    queryKey: areaKeys.detail(id),
    queryFn: () => getArea(id),
    enabled: !!id,
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createArea,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      logActivity({
        action: "Created",
        entity_type: "area",
        entity_id: data.id,
        description: `Created area: ${data.name}`,
        metadata: { name: data.name, department_id: data.department_id },
      });
    },
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<AreaInsert> & { id: string }) =>
      updateArea(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      logActivity({
        action: "Updated",
        entity_type: "area",
        entity_id: data.id,
        description: `Updated area: ${data.name}`,
        metadata: { name: data.name },
      });
    },
  });
}
