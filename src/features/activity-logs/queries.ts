import { useQuery } from "@tanstack/react-query";
import { getActivityLogsByEntity } from "./api";

export const activityLogKeys = {
  all: ["activity_logs"] as const,
  entity: (id: string) => [...activityLogKeys.all, "entity", id] as const,
};

export function useEntityActivityLogs(entityId: string) {
  return useQuery({
    queryKey: activityLogKeys.entity(entityId),
    queryFn: () => getActivityLogsByEntity(entityId),
    enabled: !!entityId,
  });
}
