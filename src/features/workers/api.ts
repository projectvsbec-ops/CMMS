import { createClient } from "@/lib/supabase/client";
import type { Worker, WorkerInsert, Department, Area } from "@/types";

export type WorkerWithRelations = Worker & {
  department: Department | null;
  area: Area | null;
};

export async function getWorkers(): Promise<WorkerWithRelations[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workers")
    .select(`
      *,
      department:departments(*),
      area:areas(*)
    `)
    .order("name");

  if (error) throw error;
  return data as WorkerWithRelations[];
}

export async function getWorker(id: string): Promise<WorkerWithRelations> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workers")
    .select(`
      *,
      department:departments(*),
      area:areas(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as WorkerWithRelations;
}

export async function createWorker(worker: WorkerInsert): Promise<Worker> {
  const supabase = createClient();
  // Nullify empty strings for nullable foreign keys and phone
  const payload = {
    ...worker,
    area_id: worker.area_id || null,
    phone: worker.phone || null,
  };

  const { data, error } = await supabase
    .from("workers")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createBulkWorkers(workers: WorkerInsert[]): Promise<Worker[]> {
  const supabase = createClient();
  
  const payload = workers.map(worker => ({
    ...worker,
    area_id: worker.area_id || null,
    phone: worker.phone || null,
  }));

  const { data, error } = await supabase
    .from("workers")
    .insert(payload)
    .select();

  if (error) throw error;
  return data;
}


export async function updateWorker(id: string, worker: Partial<WorkerInsert>): Promise<Worker> {
  const supabase = createClient();
  // Nullify empty strings for nullable foreign keys and phone
  const payload = { ...worker };
  if (payload.area_id === "") payload.area_id = null;
  if (payload.phone === "") payload.phone = null;

  const { data, error } = await supabase
    .from("workers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorker(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workers")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
