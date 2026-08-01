// ============================================================
// CMMS — Application Constants
// ============================================================

export const APP_NAME = "Campus Maintenance";
export const APP_SHORT_NAME = "CMMS";
export const APP_DESCRIPTION =
  "Campus Maintenance Management System for engineering colleges";

// ---------- Status Options ----------

export const WORKER_STATUSES = [
  { value: "active", label: "Active", color: "bg-emerald-500" },
  { value: "inactive", label: "Inactive", color: "bg-slate-400" },
  { value: "on_leave", label: "On Leave", color: "bg-amber-500" },
] as const;

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present", color: "bg-emerald-500", shortLabel: "P" },
  { value: "absent", label: "Absent", color: "bg-red-500", shortLabel: "A" },
  { value: "leave", label: "Leave", color: "bg-amber-500", shortLabel: "L" },
  { value: "half_day", label: "Half Day", color: "bg-blue-500", shortLabel: "HD" },
] as const;

export const TASK_PRIORITIES = [
  { value: "low", label: "Low", color: "bg-slate-400" },
  { value: "medium", label: "Medium", color: "bg-blue-500" },
  { value: "high", label: "High", color: "bg-amber-500" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
] as const;

export const TASK_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-slate-400" },
  { value: "assigned", label: "Assigned", color: "bg-indigo-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "on_hold", label: "On Hold", color: "bg-amber-500" },
  { value: "completed", label: "Completed", color: "bg-emerald-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
] as const;

// ---------- Navigation ----------

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Departments", href: "/departments", icon: "Building2" },
  { title: "Areas", href: "/areas", icon: "Map" },
  { title: "Workers", href: "/workers", icon: "Users" },
  { title: "Managers", href: "/managers", icon: "UserCog" },
  { title: "Attendance", href: "/attendance", icon: "ClipboardCheck" },
  { title: "Work", href: "/work", icon: "Hammer" },
  { title: "Schedule", href: "/schedule", icon: "CalendarClock" },
  { title: "Inventory", href: "/inventory", icon: "Package" },
  { title: "Reports", href: "/reports", icon: "BarChart3" },
  { title: "Settings", href: "/settings", icon: "Settings" },
] as const;

// Bottom nav shows only primary items (mobile)
export const BOTTOM_NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Attendance", href: "/attendance", icon: "ClipboardCheck" },
  { title: "Work", href: "/work", icon: "Hammer" },
  { title: "Inventory", href: "/inventory", icon: "Package" },
  { title: "More", href: "#more", icon: "Menu" },
] as const;

// ---------- Days of Week ----------

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// ---------- Inventory ----------

export const INVENTORY_UNITS = [
  "Pieces",
  "Kg",
  "Liters",
  "Meters",
  "Rolls",
  "Boxes",
  "Sets",
  "Pairs",
  "Packets",
  "Bags",
] as const;
