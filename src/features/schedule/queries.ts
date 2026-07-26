import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkerSchedules,
  createWorkerSchedule,
  createBulkWorkerSchedules,
  updateWorkerSchedule,
  getPreventiveMaintenance,
  createPreventiveMaintenance,
  updatePreventiveMaintenance,
  getScheduleTemplates,
  checkAndGeneratePreventiveMaintenance,
  type ScheduleFilters,
} from "./api";
import { logActivity } from "@/features/activity-logs/api";
import type { WorkerScheduleInsert, PreventiveMaintenanceInsert } from "@/types";
import { useEffect } from "react";

export const scheduleKeys = {
  all: ["schedule"] as const,
  workerSchedules: (filters?: ScheduleFilters) => [...scheduleKeys.all, "workerSchedules", filters] as const,
  preventiveMaintenance: () => [...scheduleKeys.all, "preventiveMaintenance"] as const,
  templates: () => [...scheduleKeys.all, "templates"] as const,
};

export function useWorkerSchedules(filters?: ScheduleFilters) {
  return useQuery({
    queryKey: scheduleKeys.workerSchedules(filters),
    queryFn: () => getWorkerSchedules(filters),
  });
}

export function useCreateWorkerSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: WorkerScheduleInsert) => {
      const data = await createWorkerSchedule(schedule);
      logActivity({
        action: "Created Schedule",
        entity_type: "worker_schedules",
        entity_id: data.id,
        description: `Scheduled block for worker: ${data.work_title}`,
        metadata: {},
      }).catch(console.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useBulkCreateWorkerSchedules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedules: WorkerScheduleInsert[]) => {
      const data = await createBulkWorkerSchedules(schedules);
      logActivity({
        action: "Bulk Imported Schedules",
        entity_type: "worker_schedules",
        entity_id: data?.[0]?.id || 'bulk',
        description: `Bulk imported ${schedules.length} schedules`,
        metadata: { count: schedules.length },
      }).catch(console.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdateWorkerSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WorkerScheduleInsert> }) => {
      const data = await updateWorkerSchedule(id, updates);
      logActivity({
        action: "Updated Schedule",
        entity_type: "worker_schedules",
        entity_id: id,
        description: `Updated schedule status to ${updates.schedule_status || 'modified'}`,
        metadata: {},
      }).catch(console.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function usePreventiveMaintenance() {
  return useQuery({
    queryKey: scheduleKeys.preventiveMaintenance(),
    queryFn: () => getPreventiveMaintenance(),
  });
}

export function useCreatePreventiveMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pm: PreventiveMaintenanceInsert) => {
      const data = await createPreventiveMaintenance(pm);
      logActivity({
        action: "Created PM Plan",
        entity_type: "preventive_maintenance",
        entity_id: data.id,
        description: `Created new PM plan: ${data.title}`,
        metadata: {},
      }).catch(console.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdatePreventiveMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PreventiveMaintenanceInsert> }) => {
      const data = await updatePreventiveMaintenance(id, updates);
      logActivity({
        action: "Updated PM Plan",
        entity_type: "preventive_maintenance",
        entity_id: id,
        description: `Updated PM plan details.`,
        metadata: {},
      }).catch(console.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useScheduleTemplates() {
  return useQuery({
    queryKey: scheduleKeys.templates(),
    queryFn: () => getScheduleTemplates(),
  });
}

/**
 * A custom hook to lazily evaluate Preventive Maintenance.
 * Run this on the Schedule/Dashboard root components.
 */
export function useLazyCheckPreventiveMaintenance() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    checkAndGeneratePreventiveMaintenance()
      .then((generatedAnything) => {
        if (mounted && generatedAnything) {
          // Invalidate tasks and schedule so the newly generated tasks show up!
          queryClient.invalidateQueries({ queryKey: scheduleKeys.preventiveMaintenance() });
          queryClient.invalidateQueries({ queryKey: ["work_tasks"] }); 
        }
      })
      .catch(console.error);
    
    return () => { mounted = false; };
  }, [queryClient]);
}
