import { createClient } from "@/lib/supabase/client";

export interface DashboardKPIs {
  totalWorkers: number;
  presentToday: number;
  absentToday: number;
  activeTasks: number;
  completedToday: number;
  overdueTasks: number;
  lowStockItems: number;
  scheduledJobsToday: number;
}

export interface WorkAnalytics {
  tasksByStatus: { name: string; value: number; color: string }[];
  tasksByPriority: { name: string; value: number }[];
  weeklyTrend: { date: string; completed: number; created: number }[];
}

export interface InventoryAnalytics {
  topMaterials: { name: string; used: number }[];
  lowStockList: { id: string; name: string; stock: number; reorder: number }[];
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalWorkers },
    { count: presentToday },
    { count: activeTasks },
    { count: completedToday },
    { count: overdueTasks },
    { count: scheduledJobsToday },
    { data: items }
  ] = await Promise.all([
    supabase.from("workers").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).in("status", ["Present", "Half Day"]),
    supabase.from("work_tasks").select("*", { count: "exact", head: true }).in("status", ["pending", "assigned", "in_progress", "on_hold"]),
    supabase.from("work_tasks").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_date", `${today}T00:00:00Z`),
    supabase.from("work_tasks").select("*", { count: "exact", head: true }).not("status", "in", '("completed","cancelled")').lt("target_date", today),
    supabase.from("worker_schedules").select("*", { count: "exact", head: true }).eq("schedule_date", today).neq("schedule_status", "Cancelled"),
    // Fetch all active items to calculate low stock locally since we can't do dynamic computed where easily without a view
    supabase.from("inventory_items").select("current_stock, reorder_level").eq("is_active", true)
  ]);

  let lowStockCount = 0;
  if (items) {
    lowStockCount = items.filter(item => item.current_stock <= item.reorder_level).length;
  }

  // Workers - Present = Absent (Simplification for KPI)
  const absentToday = (totalWorkers || 0) - (presentToday || 0);

  return {
    totalWorkers: totalWorkers || 0,
    presentToday: presentToday || 0,
    absentToday: absentToday >= 0 ? absentToday : 0,
    activeTasks: activeTasks || 0,
    completedToday: completedToday || 0,
    overdueTasks: overdueTasks || 0,
    lowStockItems: lowStockCount,
    scheduledJobsToday: scheduledJobsToday || 0,
  };
}

export async function getWorkAnalytics(): Promise<WorkAnalytics> {
  const supabase = createClient();
  
  // Tasks by Status
  const { data: statusData } = await supabase.from("work_tasks").select("status");
  const statusCounts = (statusData || []).reduce((acc: any, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const tasksByStatus = [
    { name: "Pending", value: statusCounts["pending"] || 0, color: "#94a3b8" },
    { name: "Assigned", value: statusCounts["assigned"] || 0, color: "#3b82f6" },
    { name: "In Progress", value: statusCounts["in_progress"] || 0, color: "#f59e0b" },
    { name: "Completed", value: statusCounts["completed"] || 0, color: "#10b981" },
  ].filter(s => s.value > 0);

  // Tasks by Priority
  const { data: priorityData } = await supabase.from("work_tasks").select("priority").not("status", "in", '("completed","cancelled")');
  const priorityCounts = (priorityData || []).reduce((acc: any, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});
  
  const tasksByPriority = [
    { name: "Low", value: priorityCounts["low"] || 0 },
    { name: "Medium", value: priorityCounts["medium"] || 0 },
    { name: "High", value: priorityCounts["high"] || 0 },
    { name: "Critical", value: priorityCounts["critical"] || 0 },
  ].filter(p => p.value > 0);

  // Weekly Trend (last 7 days)
  const weeklyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    // We would ideally aggregate in SQL, but for simplicity we fetch within a date range and count locally
    const { count: completed } = await supabase
      .from("work_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_date", `${dateStr}T00:00:00Z`)
      .lt("completed_date", `${dateStr}T23:59:59Z`);
      
    const { count: created } = await supabase
      .from("work_tasks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${dateStr}T00:00:00Z`)
      .lt("created_at", `${dateStr}T23:59:59Z`);

    weeklyTrend.push({
      date: dateStr.substring(5), // MM-DD
      completed: completed || 0,
      created: created || 0
    });
  }

  return {
    tasksByStatus,
    tasksByPriority,
    weeklyTrend
  };
}

export async function getInventoryAnalytics(): Promise<InventoryAnalytics> {
  const supabase = createClient();
  
  // Get all items to find low stock
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, current_stock, reorder_level")
    .eq("is_active", true);

  const lowStockList = (items || [])
    .filter(item => item.current_stock <= item.reorder_level)
    .sort((a, b) => a.current_stock - b.current_stock)
    .map(item => ({ id: item.id, name: item.name, stock: item.current_stock, reorder: item.reorder_level }))
    .slice(0, 5); // top 5 lowest

  // Top materials used (most stock_out transactions)
  // For simplicity, we just fetch recent stock_out transactions and aggregate
  const { data: txs } = await supabase
    .from("inventory_transactions")
    .select("quantity, inventory_item_id, item:inventory_items(name)")
    .eq("transaction_type", "stock_out")
    .order("created_at", { ascending: false })
    .limit(100);

  const usage: Record<string, { name: string; used: number }> = {};
  (txs || []).forEach((tx: any) => {
    if (!tx.item) return;
    if (!usage[tx.inventory_item_id]) {
      usage[tx.inventory_item_id] = { name: tx.item.name, used: 0 };
    }
    usage[tx.inventory_item_id].used += Math.abs(tx.quantity);
  });

  const topMaterials = Object.values(usage)
    .sort((a, b) => b.used - a.used)
    .slice(0, 5);

  return { lowStockList, topMaterials };
}
