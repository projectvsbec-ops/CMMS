import { createClient } from "@/lib/supabase/client";
import type { Department, DepartmentInsert } from "@/types";

export async function getDepartments(): Promise<Department[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getDepartment(id: string): Promise<Department> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDepartment(department: DepartmentInsert): Promise<Department> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .insert([department])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, department: Partial<DepartmentInsert>): Promise<Department> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .update(department)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
