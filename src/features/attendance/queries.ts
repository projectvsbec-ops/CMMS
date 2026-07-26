import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDailyAttendance, upsertAttendanceBatch, getAttendanceHistory, getWorkerAttendanceStats, AttendanceHistoryFilters } from "./api";
import { logActivity } from "@/features/activity-logs/api";
import type { AttendanceInsert } from "@/types";

export const attendanceKeys = {
  all: ["attendance"] as const,
  daily: (date: string, departmentId?: string) => [...attendanceKeys.all, "daily", date, departmentId] as const,
  history: (filters: AttendanceHistoryFilters) => [...attendanceKeys.all, "history", filters] as const,
  workerStats: (workerId: string, month: string) => [...attendanceKeys.all, "workerStats", workerId, month] as const,
};

export function useDailyAttendance(date: string, departmentId?: string) {
  return useQuery({
    queryKey: attendanceKeys.daily(date, departmentId),
    queryFn: () => getDailyAttendance(date, departmentId),
    enabled: !!date,
  });
}

export function useUpsertAttendanceBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ records, date }: { records: AttendanceInsert[]; date: string }) => {
      const data = await upsertAttendanceBatch(records);
      
      // Log the activity asynchronously
      logActivity({
        action: "Batch Upsert",
        entity_type: "attendance",
        entity_id: null,
        description: `Marked/Updated attendance for ${records.length} workers on ${date}`,
        metadata: { date, count: records.length },
      }).catch(console.error);

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the daily query so it refetches cleanly
      queryClient.invalidateQueries({ queryKey: attendanceKeys.daily(variables.date, undefined) });
      // Invalidate history and worker stats generally
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useAttendanceHistory(filters: AttendanceHistoryFilters) {
  return useQuery({
    queryKey: attendanceKeys.history(filters),
    queryFn: () => getAttendanceHistory(filters),
  });
}

export function useWorkerAttendanceStats(workerId: string, monthDate: Date) {
  // Use YYYY-MM as key
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
  
  return useQuery({
    queryKey: attendanceKeys.workerStats(workerId, monthKey),
    queryFn: () => getWorkerAttendanceStats(workerId, monthDate),
    enabled: !!workerId && !!monthDate,
  });
}
