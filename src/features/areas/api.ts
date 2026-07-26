import { createClient } from "@/lib/supabase/client";
import type { Area, AreaInsert, Department } from "@/types";

export type AreaWithDepartment = Area & { department: Department | null };

export async function getAreas(): Promise<AreaWithDepartment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("areas")
    .select(`*, department:departments(*)`)
    .order("name");

  if (error) throw error;
  return data as AreaWithDepartment[];
}

export async function getArea(id: string): Promise<AreaWithDepartment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("areas")
    .select(`*, department:departments(*)`)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as AreaWithDepartment;
}

export async function createArea(area: AreaInsert): Promise<Area> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("areas")
    .insert([area])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateArea(id: string, area: Partial<AreaInsert>): Promise<Area> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("areas")
    .update(area)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
