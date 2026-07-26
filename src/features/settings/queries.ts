import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSetting } from "./api";
import { toast } from "@/components/ui/toast";
import { logActivity } from "@/features/activity-logs/api";

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: getSettings,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, settings_json }: { category: string; settings_json: Record<string, any> }) => 
      updateSetting(category, settings_json),
    onSuccess: (_, variables) => {
      toast.add({ title: "Settings Saved", description: "Your configuration has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      
      logActivity({
        action: "Updated Settings",
        entity_type: "app_settings",
        entity_id: null,
        description: `Updated settings for category: ${variables.category}`,
        metadata: null,
      }).catch(console.error);
    },
    onError: (error: any) => {
      toast.add({ title: "Error", description: error.message || "Failed to save settings", type: "error" });
    }
  });
}
