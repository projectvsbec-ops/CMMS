// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workerSchema, type WorkerFormValues } from "../schemas";
import { useCreateWorker, useUpdateWorker } from "../queries";
import { useDepartments } from "@/features/departments/queries";
import { useAreas } from "@/features/areas/queries";
import { WorkerWithRelations } from "@/features/workers/api";
import { toast } from "@/components/ui/toast";
import { FormSheet } from "@/components/shared/form-sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface WorkerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker?: WorkerWithRelations | null;
}

export function WorkerForm({ open, onOpenChange, worker }: WorkerFormProps) {
  const isEditing = !!worker;
  const createMutation = useCreateWorker();
  const updateMutation = useUpdateWorker();
  
  const { data: departments, isLoading: isDepartmentsLoading } = useDepartments();
  const { data: allAreas, isLoading: isAreasLoading } = useAreas();

  const form = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      employee_id: "",
      name: "",
      department_id: "",
      area_id: "",
      phone: "",
      joining_date: new Date().toISOString().split("T")[0],
      status: "active",
      notes: "",
      is_active: true,
    },
  });

  // Watch department to filter areas
  const selectedDepartmentId = useWatch({
    control: form.control,
    name: "department_id",
  });

  const availableAreas = allAreas?.filter(
    (area) => area.department_id === selectedDepartmentId
  );

  // Clear area selection if department changes to one that doesn't have that area
  useEffect(() => {
    if (!open) return;
    const currentAreaId = form.getValues("area_id");
    if (currentAreaId) {
      const areaExistsInDepartment = availableAreas?.some(
        (a) => a.id === currentAreaId
      );
      if (!areaExistsInDepartment && availableAreas && availableAreas.length > 0) {
        // We let the user re-select, or default to empty
        form.setValue("area_id", "");
      }
    }
  }, [selectedDepartmentId, availableAreas, form, open]);

  // Reset form when worker changes
  useEffect(() => {
    if (worker) {
      form.reset({
        employee_id: worker.employee_id,
        name: worker.name,
        department_id: worker.department_id,
        area_id: worker.area_id || "",
        phone: worker.phone || "",
        joining_date: worker.joining_date,
        status: worker.status,
        notes: worker.notes || "",
        is_active: worker.is_active,
      });
    } else {
      form.reset({
        employee_id: "",
        name: "",
        department_id: "",
        area_id: "",
        phone: "",
        joining_date: new Date().toISOString().split("T")[0],
        status: "active",
        notes: "",
        is_active: true,
      });
    }
  }, [worker, form]);

  const onSubmit = async (values: WorkerFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: worker.id,
          ...values,
        } as any);
        toast.add({
          title: "Worker updated",
          description: "Worker profile successfully updated.",
        });
      } else {
        await createMutation.mutateAsync(values as any);
        toast.add({
          title: "Worker added",
          description: "New worker successfully added to the system.",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      // Very basic error parsing for duplicates
      const isDuplicate = error.message?.includes("unique") || error.code === "23505";
      toast.add({
        title: "Error",
        description: isDuplicate ? "A worker with this Employee ID already exists." : "Failed to save worker.",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Worker" : "Add Worker"}
      description={
        isEditing
          ? "Update worker profile and assignment details."
          : "Register a new worker in the system."
      }
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Form {...(form as any)}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="employee_id"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. EMP-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="name"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="department_id"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      disabled={isDepartmentsLoading}
                    >
                      <option value="" disabled>Select department</option>
                      {departments?.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="area_id"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Assigned Area (Optional)</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      disabled={isAreasLoading || !selectedDepartmentId}
                      value={field.value || ""}
                    >
                      <option value="">No specific area</option>
                      {availableAreas?.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" type="tel" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="joining_date"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Joining Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...field}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional information..."
                    className="resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormSheet>
  );
}
