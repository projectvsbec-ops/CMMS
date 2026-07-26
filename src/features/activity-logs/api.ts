import { createClient } from "@/lib/supabase/client";
import type { ActivityLogInsert } from "@/types";

export async function logActivity(log: ActivityLogInsert): Promise<void> {
  const supabase = createClient();
  

  const { error } = await supabase.from("activity_logs").insert([
    log,
  ]);

  if (error) {
    console.error("Failed to log activity:", error);
    // We intentionally don't throw here to prevent the main action from failing
    // just because the log failed.
  }
}

export async function getActivityLogsByEntity(entityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRecentActivityLogs({ limit = 10 }: { limit?: number }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
