import { useQuery } from "@tanstack/react-query";
import { getDashboardKPIs, getWorkAnalytics, getInventoryAnalytics } from "./api";

const STALE_TIME = 60000; // 1 minute
const REFETCH_INTERVAL = 60000; // 1 minute

export const dashboardKeys = {
  all: ["dashboard"] as const,
  kpis: () => [...dashboardKeys.all, "kpis"] as const,
  workAnalytics: () => [...dashboardKeys.all, "workAnalytics"] as const,
  inventoryAnalytics: () => [...dashboardKeys.all, "inventoryAnalytics"] as const,
};

export function useDashboardKPIs() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: getDashboardKPIs,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useWorkAnalytics() {
  return useQuery({
    queryKey: dashboardKeys.workAnalytics(),
    queryFn: getWorkAnalytics,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useInventoryAnalytics() {
  return useQuery({
    queryKey: dashboardKeys.inventoryAnalytics(),
    queryFn: getInventoryAnalytics,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
  });
}
