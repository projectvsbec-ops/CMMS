import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInventoryCategories,
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  getInventoryTransactions,
  recordInventoryTransaction,
  getInventoryDashboardStats,
  getInventoryTransactionsByTask,
  InventoryFilters,
} from "./api";
import { logActivity } from "@/features/activity-logs/api";
import type { InventoryItemInsert, InventoryTransactionInsert } from "@/types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  categories: () => [...inventoryKeys.all, "categories"] as const,
  items: (filters?: InventoryFilters) => [...inventoryKeys.all, "items", filters] as const,
  item: (id: string) => [...inventoryKeys.all, "item", id] as const,
  transactions: (itemId: string) => [...inventoryKeys.all, "transactions", itemId] as const,
  taskTransactions: (taskId: string) => [...inventoryKeys.all, "taskTransactions", taskId] as const,
  dashboard: () => [...inventoryKeys.all, "dashboardStats"] as const,
};

export function useInventoryCategories() {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: () => getInventoryCategories(),
  });
}

export function useInventoryItems(filters?: InventoryFilters) {
  return useQuery({
    queryKey: inventoryKeys.items(filters),
    queryFn: () => getInventoryItems(filters),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.item(id),
    queryFn: () => getInventoryItemById(id),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: InventoryItemInsert) => {
      const data = await createInventoryItem(item);
      logActivity({
        action: "Created Inventory Item",
        entity_type: "inventory_items",
        entity_id: data.id,
        description: `Created new item: ${data.name}`,
        metadata: { name: data.name, unit: data.unit },
      }).catch(console.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, logMessage }: { id: string; updates: Partial<InventoryItemInsert>; logMessage?: string }) => {
      const data = await updateInventoryItem(id, updates);
      
      const message = logMessage || "Updated inventory item details";
      logActivity({
        action: updates.is_active === false ? "Archived Inventory Item" : "Updated Inventory Item",
        entity_type: "inventory_items",
        entity_id: id,
        description: message,
        metadata: updates,
      }).catch(console.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.item(variables.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard() });
    },
  });
}

export function useInventoryTransactions(itemId: string) {
  return useQuery({
    queryKey: inventoryKeys.transactions(itemId),
    queryFn: () => getInventoryTransactions(itemId),
    enabled: !!itemId,
  });
}

export function useTaskInventoryTransactions(taskId: string) {
  return useQuery({
    queryKey: inventoryKeys.taskTransactions(taskId),
    queryFn: () => getInventoryTransactionsByTask(taskId),
    enabled: !!taskId,
  });
}

export function useRecordTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: InventoryTransactionInsert) => {
      const data = await recordInventoryTransaction(transaction);
      
      let actionName = "Stock Out";
      if (transaction.transaction_type === "stock_in") actionName = "Stock In";
      if (transaction.transaction_type === "adjustment") actionName = "Stock Adjustment";
      if (transaction.transaction_type === "return") actionName = "Stock Return";

      logActivity({
        action: actionName,
        entity_type: "inventory_items",
        entity_id: transaction.inventory_item_id,
        description: `Recorded ${transaction.transaction_type} of ${transaction.quantity} units`,
        metadata: { quantity: transaction.quantity, type: transaction.transaction_type, task: transaction.work_task_id },
      }).catch(console.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the item to get the fresh stock (updated by trigger)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.item(variables.inventory_item_id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transactions(variables.inventory_item_id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard() });
      if (variables.work_task_id) {
        queryClient.invalidateQueries({ queryKey: inventoryKeys.taskTransactions(variables.work_task_id) });
      }
    },
  });
}

export function useInventoryDashboardStats() {
  return useQuery({
    queryKey: inventoryKeys.dashboard(),
    queryFn: () => getInventoryDashboardStats(),
    refetchInterval: 5 * 60 * 1000,
  });
}
