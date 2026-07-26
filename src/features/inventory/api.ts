import { createClient } from "@/lib/supabase/client";
import type { 
  InventoryCategory, 
  InventoryItemWithRelations, 
  InventoryItemInsert, 
  InventoryTransactionWithRelations,
  InventoryTransactionInsert 
} from "@/types";
import { format } from "date-fns";

export async function getInventoryCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as InventoryCategory[];
}

export type InventoryFilters = {
  categoryId?: string;
  departmentId?: string;
  search?: string;
  status?: "all" | "active" | "archived";
  stockStatus?: "all" | "low" | "out";
};

export async function getInventoryItems(filters?: InventoryFilters) {
  const supabase = createClient();
  let query = supabase
    .from("inventory_items")
    .select(`
      *,
      category:inventory_categories(*),
      department:departments(*)
    `)
    .order("name");

  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.departmentId) query = query.eq("department_id", filters.departmentId);
  
  if (filters?.status === "active") query = query.eq("is_active", true);
  if (filters?.status === "archived") query = query.eq("is_active", false);

  // Note: we can't do direct inequality compares between columns in Supabase standard client easily without a view or rpc for (current_stock <= reorder_level)
  // For 'out' it's simple: current_stock = 0.
  // For 'low' we will fetch and filter in memory, or we just rely on standard filtering.
  if (filters?.stockStatus === "out") {
    query = query.lte("current_stock", 0);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,item_code.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  let items = data as InventoryItemWithRelations[];

  if (filters?.stockStatus === "low") {
    items = items.filter(item => item.current_stock <= item.reorder_level && item.current_stock > 0);
  }

  return items;
}

export async function getInventoryItemById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select(`
      *,
      category:inventory_categories(*),
      department:departments(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as InventoryItemWithRelations;
}

export async function createInventoryItem(item: InventoryItemInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItemInsert>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInventoryTransactions(itemId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select(`
      *,
      work_task:work_tasks(id, task_number, title)
    `)
    .eq("inventory_item_id", itemId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as InventoryTransactionWithRelations[];
}

export async function recordInventoryTransaction(transaction: InventoryTransactionInsert) {
  const supabase = createClient();
  // We use Postgres trigger to auto-update the stock on the item!
  const { data, error } = await supabase
    .from("inventory_transactions")
    .insert([transaction])
    .select()
    .single();

  if (error) {
    // Check for our custom Postgres RAISE EXCEPTION regarding negative stock
    if (error.message.includes("negative stock")) {
      throw new Error("Insufficient stock available for this transaction.");
    }
    throw error;
  }
  return data;
}

export async function getInventoryDashboardStats() {
  const supabase = createClient();
  
  const { data: allItems, error } = await supabase
    .from("inventory_items")
    .select("current_stock, reorder_level")
    .eq("is_active", true);
    
  if (error) throw error;
  
  let lowStockCount = 0;
  let outOfStockCount = 0;
  
  allItems.forEach(item => {
    if (item.current_stock <= 0) outOfStockCount++;
    else if (item.current_stock <= item.reorder_level) lowStockCount++;
  });

  return {
    totalActiveItems: allItems.length,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount
  };
}

// Helper to get transactions by Work Task (to show what materials were used)
export async function getInventoryTransactionsByTask(taskId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select(`
      *,
      item:inventory_items(id, name, unit)
    `)
    .eq("work_task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as InventoryTransactionWithRelations[];
}
