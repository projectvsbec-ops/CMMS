import { createClient } from "@/lib/supabase/client";

export interface SearchResult {
  id: string;
  type: "worker" | "task" | "inventory";
  title: string;
  subtitle: string;
  link: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = createClient();
  const searchPattern = `%${query}%`;
  const results: SearchResult[] = [];

  // Run searches in parallel
  const [workersRes, tasksRes, inventoryRes] = await Promise.all([
    supabase.from("workers").select("id, name, employee_id").or(`name.ilike.${searchPattern},employee_id.ilike.${searchPattern}`).limit(5),
    supabase.from("work_tasks").select("id, task_number, title").or(`title.ilike.${searchPattern},task_number.ilike.${searchPattern}`).limit(5),
    supabase.from("inventory_items").select("id, item_code, name").or(`name.ilike.${searchPattern},item_code.ilike.${searchPattern}`).limit(5),
  ]);

  if (workersRes.data) {
    workersRes.data.forEach(w => {
      results.push({
        id: w.id,
        type: "worker",
        title: w.name,
        subtitle: `ID: ${w.employee_id}`,
        link: `/workers/${w.id}`
      });
    });
  }

  if (tasksRes.data) {
    tasksRes.data.forEach(t => {
      results.push({
        id: t.id,
        type: "task",
        title: t.task_number,
        subtitle: t.title,
        link: `/work/${t.id}`
      });
    });
  }

  if (inventoryRes.data) {
    inventoryRes.data.forEach(i => {
      results.push({
        id: i.id,
        type: "inventory",
        title: i.name,
        subtitle: `Code: ${i.item_code}`,
        link: `/inventory/${i.id}`
      });
    });
  }

  return results;
}
