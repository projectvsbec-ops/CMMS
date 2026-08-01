import { createClient } from "@/lib/supabase/client";
import type { Manager, ManagerInsert, ManagerUpdate } from "@/types";

export interface ManagerWithDepartment extends Manager {
  department: { name: string } | null;
}

export async function getManagers(departmentId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("managers")
    .select(`
      *,
      department:departments(name)
    `)
    .order("name");

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ManagerWithDepartment[];
}

export async function getManager(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("managers")
    .select(`*, department:departments(name)`)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ManagerWithDepartment;
}

export async function createManager(manager: ManagerInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("managers")
    .insert([manager])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateManager(id: string, updates: ManagerUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("managers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteManager(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("managers")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
