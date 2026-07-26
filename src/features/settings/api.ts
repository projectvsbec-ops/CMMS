import { createClient } from "@/lib/supabase/client";
import type { AppSetting } from "@/types";

export async function getSettings(): Promise<AppSetting[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("app_settings").select("*");
  if (error) throw error;
  return data;
}

export async function updateSetting(category: string, settings_json: Record<string, any>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ settings_json })
    .eq("category", category);

  if (error) throw error;
}
