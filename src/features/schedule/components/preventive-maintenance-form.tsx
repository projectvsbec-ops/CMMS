"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormSheet } from "@/components/shared/form-sheet";
import { toast } from "@/components/ui/toast";
import { useCreatePreventiveMaintenance, useUpdatePreventiveMaintenance } from "../queries";
import { useDepartments } from "@/features/departments/queries";
import { useAreas } from "@/features/areas/queries";
import { useWorkers } from "@/features/workers/queries";
import type { PreventiveMaintenanceWithRelations, PMFrequency } from "@/types";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  department_id: z.string().min(1, "Department is required"),
  area_id: z.string().optional().nullable(),
  frequency: z.enum(["Daily", "Weekly", "Monthly", "Quarterly", "Half Yearly", "Yearly"]),
  next_due_date: z.string().min(1, "Next due date is required"),
  estimated_duration: z.coerce.number().min(5, "At least 5 minutes").optional().nullable(),
  assigned_worker_id: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface PreventiveMaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pm?: PreventiveMaintenanceWithRelations | null;
}

export function PreventiveMaintenanceForm({ open, onOpenChange, pm }: PreventiveMaintenanceFormProps) {
  const { data: departments } = useDepartments();
  const { data: areas } = useAreas();
  const { data: workers } = useWorkers();
  
  const createMutation = useCreatePreventiveMaintenance();
  const updateMutation = useUpdatePreventiveMaintenance();

  const isEdit = !!pm;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      department_id: "",
      area_id: "",
      frequency: "Weekly",
      next_due_date: format(new Date(), "yyyy-MM-dd"),
      estimated_duration: 60,
      assigned_worker_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (pm) {
        form.reset({
          title: pm.title,
          department_id: pm.department_id,
          area_id: pm.area_id || "",
          frequency: pm.frequency,
          next_due_date: pm.next_due_date,
          estimated_duration: pm.estimated_duration || 60,
          assigned_worker_id: pm.assigned_worker_id || "",
          is_active: pm.is_active,
        });
      } else {
        form.reset({
          title: "",
          department_id: "",
          area_id: "",
          frequency: "Weekly",
          next_due_date: format(new Date(), "yyyy-MM-dd"),
          estimated_duration: 60,
          assigned_worker_id: "",
          is_active: true,
        });
      }
    }
  }, [open, pm, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        area_id: values.area_id || null,
        assigned_worker_id: values.assigned_worker_id || null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: pm.id, updates: payload });
        toast.add({ title: "Success", description: "PM Plan updated successfully." });
      } else {
        await createMutation.mutateAsync({
          ...payload,
          estimated_duration: payload.estimated_duration || null,
          work_task_template: {}, // Default empty template properties
        });
        toast.add({ title: "Success", description: "PM Plan created successfully." });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.add({ 
        title: "Error", 
        description: error.message || "Failed to save PM Plan.", 
        type: "error" 
      });
    }
  };

  const selectedDeptId = form.watch("department_id");
  const filteredAreas = areas?.filter((a: any) => a.department_id === selectedDeptId) || [];

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Preventive Maintenance" : "New Preventive Maintenance"}
      description="Setup automated recurring work tasks."
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={createMutation.isPending || updateMutation.isPending}
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PM Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Generator Inspection" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department">
                        {departments?.find(d => d.id === field.value)?.name || "Select department"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedDeptId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area">
                        {field.value ? (filteredAreas.find((a: any) => a.id === field.value)?.name || "Select area") : "None"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {filteredAreas.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Half Yearly">Half Yearly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Due Date</FormLabel>
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
            name="estimated_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. Duration (Minutes)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="60" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_worker_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Assigned Worker (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned">
                        {field.value ? (workers?.find(w => w.id === field.value)?.name || "Unassigned") : "Unassigned"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {workers?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEdit && (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active PM Plan</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Uncheck to pause automatic task generation.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          )}

        </div>
      </Form>
    </FormSheet>
  );
}
