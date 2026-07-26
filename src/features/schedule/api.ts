import { createClient } from "@/lib/supabase/client";
import { addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";
import type { 
  WorkerScheduleWithRelations,
  PreventiveMaintenanceWithRelations,
  ScheduleTemplate,
  WorkerScheduleInsert,
  PreventiveMaintenanceInsert,
  WorkTaskInsert,
  PMFrequency
} from "@/types";
import { logActivity } from "@/features/activity-logs/api";

export type ScheduleFilters = {
  date?: string;
  startDate?: string;
  endDate?: string;
  workerId?: string;
  departmentId?: string;
};

export async function getWorkerSchedules(filters?: ScheduleFilters) {
  const supabase = createClient();
  let query = supabase
    .from("worker_schedules")
    .select(`
      *,
      worker:workers!inner(id, name, employee_id, department_id, area_id),
      template:schedule_templates(id, name),
      work_task:work_tasks(id, task_number, title)
    `)
    .order("start_time");

  if (filters?.date) query = query.eq("schedule_date", filters.date);
  if (filters?.startDate) query = query.gte("schedule_date", filters.startDate);
  if (filters?.endDate) query = query.lte("schedule_date", filters.endDate);
  if (filters?.workerId) query = query.eq("worker_id", filters.workerId);
  if (filters?.departmentId) query = query.eq("worker.department_id", filters.departmentId);

  const { data, error } = await query;
  if (error) throw error;
  return data as WorkerScheduleWithRelations[];
}

export async function createWorkerSchedule(schedule: WorkerScheduleInsert) {
  const supabase = createClient();
  
  // Conflict detection
  const { data: conflicts, error: conflictError } = await supabase
    .from("worker_schedules")
    .select("id")
    .eq("worker_id", schedule.worker_id)
    .eq("schedule_date", schedule.schedule_date)
    .neq("schedule_status", "Cancelled")
    .lt("start_time", schedule.end_time)
    .gt("end_time", schedule.start_time);
    
  if (conflictError) throw conflictError;
  if (conflicts && conflicts.length > 0) {
    throw new Error("Schedule overlap detected for this worker.");
  }

  const { data, error } = await supabase
    .from("worker_schedules")
    .insert([schedule])
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function createBulkWorkerSchedules(schedules: WorkerScheduleInsert[]) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("worker_schedules")
    .insert(schedules)
    .select();

  if (error) throw error;
  return data;
}


export async function updateWorkerSchedule(id: string, updates: Partial<WorkerScheduleInsert>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("worker_schedules")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// -----------------------------------------------------
// Preventive Maintenance
// -----------------------------------------------------

export async function getPreventiveMaintenance() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("preventive_maintenance")
    .select(`
      *,
      department:departments(id, name),
      area:areas(id, name),
      worker:workers(id, name)
    `)
    .order("next_due_date");

  if (error) throw error;
  return data as PreventiveMaintenanceWithRelations[];
}

export async function createPreventiveMaintenance(pm: PreventiveMaintenanceInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("preventive_maintenance")
    .insert([pm])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePreventiveMaintenance(id: string, updates: Partial<PreventiveMaintenanceInsert>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("preventive_maintenance")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

function calculateNextDueDate(currentDateStr: string, frequency: PMFrequency): string {
  const current = parseISO(currentDateStr);
  let nextDate = current;

  switch (frequency) {
    case "Daily": nextDate = addDays(current, 1); break;
    case "Weekly": nextDate = addWeeks(current, 1); break;
    case "Monthly": nextDate = addMonths(current, 1); break;
    case "Quarterly": nextDate = addMonths(current, 3); break;
    case "Half Yearly": nextDate = addMonths(current, 6); break;
    case "Yearly": nextDate = addYears(current, 1); break;
  }
  
  // Format as YYYY-MM-DD
  return nextDate.toISOString().split("T")[0];
}

export async function checkAndGeneratePreventiveMaintenance() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // 1. Fetch all active PMs where next_due_date <= today
  const { data: duePMs, error: fetchError } = await supabase
    .from("preventive_maintenance")
    .select("*")
    .eq("is_active", true)
    .lte("next_due_date", today);

  if (fetchError) {
    console.error("Failed to fetch due PMs", fetchError);
    return false;
  }

  if (!duePMs || duePMs.length === 0) return true;

  // 2. Generate Work Tasks & Update next_due_date
  for (const pm of duePMs) {
    try {
      const workTaskTemplate = (pm.work_task_template as Record<string, any>) || {};
      
      const newTask: WorkTaskInsert = {
        title: `[PM] ${pm.title}`,
        description: `Auto-generated Preventive Maintenance task.\nFrequency: ${pm.frequency}`,
        department_id: pm.department_id,
        area_id: pm.area_id,
        worker_id: pm.assigned_worker_id,
        category_id: workTaskTemplate.category_id || null,
        priority: workTaskTemplate.priority || "medium",
        status: "pending",
        identified_by: "PM System",
        target_date: pm.next_due_date,
        completed_date: null,
        estimated_duration: pm.estimated_duration,
        remarks: null,
      };

      // Insert Work Task
      const { data: taskData, error: taskError } = await supabase
        .from("work_tasks")
        .insert([newTask])
        .select()
        .single();

      if (taskError) throw taskError;

      // Calculate next due date
      const nextDate = calculateNextDueDate(pm.next_due_date, pm.frequency as PMFrequency);

      // Update PM record
      const { error: updateError } = await supabase
        .from("preventive_maintenance")
        .update({ next_due_date: nextDate })
        .eq("id", pm.id);

      if (updateError) throw updateError;

      // Log it
      await logActivity({
        action: "Auto-Generated PM Task",
        entity_type: "preventive_maintenance",
        entity_id: pm.id,
        description: `Generated work task ${taskData.task_number} for PM schedule.`,
        metadata: {},
      });
      
    } catch (e) {
      console.error(`Failed to generate PM for ID ${pm.id}:`, e);
      // We continue to the next one instead of halting
    }
  }

  return true;
}

// -----------------------------------------------------
// Schedule Templates
// -----------------------------------------------------
export async function getScheduleTemplates() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data as ScheduleTemplate[];
}
