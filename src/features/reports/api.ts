import { createClient } from "@/lib/supabase/client";
import type { SavedReport, SavedReportInsert, ReportFilter } from "@/types";

export async function getSavedReports(): Promise<SavedReport[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createSavedReport(report: SavedReportInsert): Promise<SavedReport> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saved_reports").insert([report]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSavedReport(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("saved_reports").delete().eq("id", id);
  if (error) throw error;
}

export async function runReport(category: string, filters: ReportFilter) {
  const supabase = createClient();
  
  let query: any;
  
  switch (category) {
    case "Work":
      query = supabase.from("work_tasks").select("*, worker:workers(name), department:departments(name), category:task_categories(name)");
      break;
    case "Inventory":
      query = supabase.from("inventory_items").select("*, category:inventory_categories(name), department:departments(name)");
      break;
    case "Attendance":
      query = supabase.from("attendance").select("*, worker:workers(name, employee_id, department:departments(name))");
      break;
    case "Worker":
      query = supabase.from("workers").select("*, department:departments(name), area:areas(name)");
      break;
    case "Schedule":
      query = supabase.from("worker_schedules").select("*, worker:workers(name)");
      break;
    default:
      throw new Error("Invalid report category");
  }

  // Apply common filters dynamically
  if (filters.date_from && filters.date_to) {
    // Determine the date column based on category
    const dateCol = category === "Attendance" ? "attendance_date" : category === "Schedule" ? "schedule_date" : "created_at";
    query = query.gte(dateCol, `${filters.date_from}T00:00:00Z`).lte(dateCol, `${filters.date_to}T23:59:59Z`);
  }

  if (filters.department_id) {
    query = query.eq("department_id", filters.department_id);
  }
  
  if (filters.worker_id) {
    query = query.eq("worker_id", filters.worker_id);
  }
  
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data;
}

export async function getBusinessIntelligence() {
  const supabase = createClient();
  
  // Aggregate a few advanced stats for BI dashboard
  // Task completion times (Average)
  const { data: tasks } = await supabase.from("work_tasks")
    .select("created_at, completed_date, status, department:departments(name)")
    .eq("status", "completed")
    .not("completed_date", "is", null);
    
  let totalMinutes = 0;
  let count = 0;
  const deptPerformance: Record<string, { total: number, count: number }> = {};
  
  (tasks || []).forEach((t: any) => {
    const created = new Date(t.created_at).getTime();
    const completed = new Date(t.completed_date).getTime();
    const durationMins = (completed - created) / (1000 * 60);
    
    if (durationMins > 0) {
      totalMinutes += durationMins;
      count++;
      
      const deptName = t.department?.name || "Unknown";
      if (!deptPerformance[deptName]) deptPerformance[deptName] = { total: 0, count: 0 };
      deptPerformance[deptName].total += durationMins;
      deptPerformance[deptName].count++;
    }
  });

  const avgCompletionMins = count > 0 ? Math.round(totalMinutes / count) : 0;
  
  const deptAverages = Object.entries(deptPerformance).map(([name, stats]) => ({
    name,
    avgMins: Math.round(stats.total / stats.count)
  }));

  // Workload this month
  const firstDay = new Date();
  firstDay.setDate(1);
  const { count: tasksThisMonth } = await supabase.from("work_tasks")
    .select("*", { count: "exact", head: true })
    .gte("created_at", firstDay.toISOString());

  return {
    avgCompletionMins,
    deptAverages,
    tasksThisMonth: tasksThisMonth || 0
  };
}
