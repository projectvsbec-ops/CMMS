import { createClient } from "@/lib/supabase/client";
import type { Attendance, AttendanceInsert, WorkerWithRelations, AttendanceWithWorker } from "@/types";
import { format, startOfMonth, endOfMonth } from "date-fns";

/**
 * Fetch all active workers and their attendance for a specific date.
 */
export async function getDailyAttendance(date: string, departmentId?: string) {
  const supabase = createClient();

  // 1. Fetch all active workers (with department/area for display)
  let workersQuery = supabase
    .from("workers")
    .select(`
      *,
      department:departments(*),
      area:areas(*)
    `)
    .eq("status", "active");

  if (departmentId) {
    workersQuery = workersQuery.eq("department_id", departmentId);
  }

  const { data: workers, error: workersError } = await workersQuery.order("name");

  if (workersError) throw workersError;

  // 2. Fetch existing attendance for the selected date
  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("*")
    .eq("attendance_date", date);

  if (attendanceError) throw attendanceError;

  // 3. Merge them
  const attendanceMap = new Map(attendance.map((a) => [a.worker_id, a]));

  const merged = (workers as WorkerWithRelations[]).map((worker) => {
    const record = attendanceMap.get(worker.id);
    return {
      worker,
      attendance: record || null,
      status: record ? record.status : null,
      remarks: record ? record.remarks : "",
    };
  });

  return merged;
}

/**
 * Batch upsert attendance records for a specific date.
 */
export async function upsertAttendanceBatch(records: AttendanceInsert[]) {
  if (records.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance")
    .upsert(records, { onConflict: "worker_id,attendance_date" })
    .select();

  if (error) throw error;
  return data;
}

export type AttendanceHistoryFilters = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  areaId?: string;
  workerId?: string;
  status?: string;
  search?: string;
};

/**
 * Fetch historical attendance with filters.
 */
export async function getAttendanceHistory(filters: AttendanceHistoryFilters) {
  const supabase = createClient();

  let query = supabase
    .from("attendance")
    .select(`
      *,
      worker:workers!inner (
        *,
        department:departments(*),
        area:areas(*)
      )
    `)
    .order("attendance_date", { ascending: false });

  if (filters.startDate) {
    query = query.gte("attendance_date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("attendance_date", filters.endDate);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.workerId) {
    query = query.eq("worker_id", filters.workerId);
  }
  
  // To filter on joined tables, Supabase requires postgrest syntax like worker.department_id.eq
  if (filters.departmentId) {
    query = query.eq("worker.department_id", filters.departmentId);
  }
  if (filters.areaId) {
    query = query.eq("worker.area_id", filters.areaId);
  }
  if (filters.search) {
    // Search on worker name or employee id
    query = query.or(`name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`, { foreignTable: "workers" });
  }

  const { data, error } = await query.limit(500); // reasonable limit

  if (error) throw error;
  return data as AttendanceWithWorker[];
}

/**
 * Fetch attendance for a specific worker within a month (or date range) to render the calendar.
 */
export async function getWorkerAttendanceStats(workerId: string, monthDate: Date) {
  const supabase = createClient();
  
  const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("worker_id", workerId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (error) throw error;
  
  return data as Attendance[];
}
