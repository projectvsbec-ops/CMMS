// ============================================================
// CMMS — Shared Type Definitions
// ============================================================

// ---------- Enums (mirrored from DB constraints) ----------

export type WorkerStatus = "active" | "inactive" | "on_leave";

export type AttendanceStatus = "present" | "absent" | "leave" | "half_day";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

// ---------- Database Row Types ----------

export interface Department {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  employee_id: string;
  department_id: string;
  area_id: string | null;
  phone: string | null;
  status: WorkerStatus;
  joining_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  worker_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WorkTask {
  id: string;
  task_number: string;
  title: string;
  description: string | null;
  department_id: string;
  area_id: string | null;
  worker_id: string | null;
  category_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  identified_by: string | null;
  target_date: string | null;
  completed_date: string | null;
  estimated_duration: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}



export interface ScheduleTemplate {
  id: string;
  name: string;
  department_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ScheduleStatus = "Scheduled" | "Started" | "Completed" | "Cancelled";

export interface WorkerSchedule {
  id: string;
  worker_id: string;
  template_id: string | null;
  schedule_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  work_title: string;
  work_description: string | null;
  work_task_id: string | null;
  schedule_status: ScheduleStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export type PMFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Half Yearly" | "Yearly";

export interface PreventiveMaintenance {
  id: string;
  title: string;
  department_id: string;
  area_id: string | null;
  frequency: PMFrequency;
  next_due_date: string;
  estimated_duration: number | null;
  assigned_worker_id: string | null;
  work_task_template: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  item_code: string;
  name: string;
  category_id: string | null;
  department_id: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number | null;
  reorder_level: number;
  store_location: string | null;
  supplier: string | null;
  unit_cost: number;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "stock_in" | "stock_out" | "adjustment" | "return";

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  transaction_type: TransactionType;
  quantity: number;
  work_task_id: string | null;
  remarks: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ---------- Joined / Extended Types ----------

export interface WorkerWithRelations extends Worker {
  department?: Department;
  area?: Area;
}

export interface AttendanceWithWorker extends Attendance {
  worker?: WorkerWithRelations;
}

export interface WorkTaskWithRelations extends WorkTask {
  worker?: Worker;
  department?: Department;
  area?: Area;
  category?: TaskCategory;
}

export interface InventoryItemWithRelations extends InventoryItem {
  category?: InventoryCategory;
  department?: Department;
}

export interface InventoryTransactionWithRelations extends InventoryTransaction {
  item?: InventoryItem;
  work_task?: WorkTask;
}

export interface WorkerScheduleWithRelations extends WorkerSchedule {
  worker?: Worker;
  template?: ScheduleTemplate;
  work_task?: WorkTask;
}

export interface PreventiveMaintenanceWithRelations extends PreventiveMaintenance {
  department?: Department;
  area?: Area;
  worker?: Worker;
}

// ---------- Insert Types (omit auto-generated fields) ----------

export type DepartmentInsert = Omit<Department, "id" | "created_at" | "updated_at">;
export type AreaInsert = Omit<Area, "id" | "created_at" | "updated_at">;
export type WorkerInsert = Omit<Worker, "id" | "created_at" | "updated_at">;
export type AttendanceInsert = Omit<
  Attendance,
  "id" | "created_at" | "updated_at"
>;
export type WorkTaskInsert = Omit<
  WorkTask,
  "id" | "task_number" | "created_at" | "updated_at"
>;
export type WorkTaskUpdate = Partial<WorkTaskInsert> & { id: string };
export type ScheduleTemplateInsert = Omit<ScheduleTemplate, "id" | "created_at" | "updated_at">;
export type WorkerScheduleInsert = Omit<WorkerSchedule, "id" | "created_at" | "updated_at">;
export type WorkerScheduleUpdate = Partial<WorkerScheduleInsert> & { id: string };
export type PreventiveMaintenanceInsert = Omit<PreventiveMaintenance, "id" | "created_at" | "updated_at">;
export type PreventiveMaintenanceUpdate = Partial<PreventiveMaintenanceInsert> & { id: string };
export type InventoryItemInsert = Omit<
  InventoryItem,
  "id" | "item_code" | "created_at" | "updated_at" | "current_stock"
>;
export type InventoryTransactionInsert = Omit<InventoryTransaction, "id" | "created_at">;
export type ActivityLogInsert = Omit<ActivityLog, "id" | "created_at">;

// ---------- UI-Only Types ----------

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface StatCardData {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// ==========================================
// REPORTS MODULE
// ==========================================

export interface ReportFilter {
  date_from?: string;
  date_to?: string;
  department_id?: string;
  area_id?: string;
  worker_id?: string;
  status?: string;
  priority?: string;
  category_id?: string;
}

export interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  category: "Work" | "Inventory" | "Attendance" | "Schedule" | "Worker" | string;
  filters: ReportFilter;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SavedReportInsert = Omit<SavedReport, "id" | "created_at" | "updated_at">;

// ==========================================
// SETTINGS & NOTIFICATIONS MODULE
// ==========================================

export interface AppSetting {
  id: string;
  category: string;
  settings_json: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

export type NotificationType = "info" | "warning" | "error" | "success";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationInsert = Omit<AppNotification, "id" | "created_at">;
