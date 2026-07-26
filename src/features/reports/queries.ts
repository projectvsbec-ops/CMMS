import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSavedReports, createSavedReport, deleteSavedReport, runReport, getBusinessIntelligence } from "./api";
import { toast } from "@/components/ui/toast";
import type { SavedReportInsert, ReportFilter } from "@/types";

export const reportKeys = {
  all: ["reports"] as const,
  saved: () => [...reportKeys.all, "saved"] as const,
  bi: () => [...reportKeys.all, "bi"] as const,
  run: (category: string, filters: ReportFilter) => [...reportKeys.all, "run", category, filters] as const,
};

export function useSavedReports() {
  return useQuery({
    queryKey: reportKeys.saved(),
    queryFn: getSavedReports,
  });
}

export function useCreateSavedReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (report: SavedReportInsert) => createSavedReport(report),
    onSuccess: () => {
      toast.add({ title: "Report Saved", description: "Your report configuration has been saved." });
      queryClient.invalidateQueries({ queryKey: reportKeys.saved() });
    },
    onError: (error: any) => {
      toast.add({ title: "Error", description: error.message || "Failed to save report", type: "error" });
    }
  });
}

export function useDeleteSavedReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSavedReport(id),
    onSuccess: () => {
      toast.add({ title: "Report Deleted", description: "The saved report has been removed." });
      queryClient.invalidateQueries({ queryKey: reportKeys.saved() });
    },
    onError: (error: any) => {
      toast.add({ title: "Error", description: error.message || "Failed to delete report", type: "error" });
    }
  });
}

export function useRunReport(category: string, filters: ReportFilter, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.run(category, filters),
    queryFn: () => runReport(category, filters),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessIntelligence() {
  return useQuery({
    queryKey: reportKeys.bi(),
    queryFn: getBusinessIntelligence,
    staleTime: 60000,
  });
}
