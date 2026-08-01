import { createClient } from "@/lib/supabase/client";
import type { TaskCategory, WorkTaskWithRelations, WorkTaskInsert, WorkTaskUpdate } from "@/types";
import { format } from "date-fns";

export async function getTaskCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task_categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as TaskCategory[];
}

export type WorkTaskFilters = {
  departmentId?: string;
  areaId?: string;
  workerId?: string;
  categoryId?: string;
  priority?: string;
  status?: string;
  search?: string;
  overdue?: boolean;
};

export async function getWorkTasks(filters?: WorkTaskFilters) {
  const supabase = createClient();
  
  let query = supabase
    .from("work_tasks")
    .select(`
      *,
      department:departments(*),
      area:areas(*),
      worker:workers(*),
      manager:managers(*),
      category:task_categories(*)
    `)
    .order("created_at", { ascending: false });

  if (filters?.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters?.areaId) query = query.eq("area_id", filters.areaId);
  if (filters?.workerId) query = query.eq("worker_id", filters.workerId);
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.status) query = query.eq("status", filters.status);
  
  if (filters?.overdue) {
    const today = format(new Date(), "yyyy-MM-dd");
    query = query.lt("target_date", today).neq("status", "completed").neq("status", "cancelled");
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,task_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as WorkTaskWithRelations[];
}

export async function getWorkTaskById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_tasks")
    .select(`
      *,
      department:departments(*),
      area:areas(*),
      worker:workers(*),
      manager:managers(*),
      category:task_categories(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as WorkTaskWithRelations;
}

export async function createWorkTask(task: WorkTaskInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_tasks")
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkTask(id: string, updates: Partial<WorkTaskInsert>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkUpdateWorkTasks(ids: string[], updates: Partial<WorkTaskInsert>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_tasks")
    .update(updates)
    .in("id", ids)
    .select();

  if (error) throw error;
  return data;
}

// ---------------- Dashboard Analytics ----------------

export async function getDashboardStats() {
  const supabase = createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { count: pendingCount },
    { count: completedTodayCount },
    { count: overdueCount },
    { count: highPriorityCount }
  ] = await Promise.all([
    supabase.from("work_tasks").select("*", { count: "exact", head: true }).in("status", ["pending", "assigned", "on_hold"]),
    supabase.from("work_tasks").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_date", `${today}T00:00:00Z`),
    supabase.from("work_tasks").select("*", { count: "exact", head: true }).lt("target_date", today).not("status", "in", '("completed","cancelled")'),
    supabase.from("work_tasks").select("*", { count: "exact", head: true }).in("priority", ["high", "critical"]).not("status", "in", '("completed","cancelled")')
  ]);

  return {
    pending: pendingCount || 0,
    completedToday: completedTodayCount || 0,
    overdue: overdueCount || 0,
    highPriority: highPriorityCount || 0,
  };
}
