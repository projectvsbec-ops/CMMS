"use client";

import { useEffect, useState } from "react";
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
import { useCreateWorkerSchedule, useUpdateWorkerSchedule } from "../queries";
import { useWorkers } from "@/features/workers/queries";
import type { WorkerScheduleWithRelations } from "@/types";

const formSchema = z.object({
  worker_id: z.string().min(1, "Worker is required"),
  schedule_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  work_title: z.string().min(3, "Title must be at least 3 characters"),
  location: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
}).refine(data => data.start_time < data.end_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});

type FormValues = z.infer<typeof formSchema>;

interface WorkerScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: WorkerScheduleWithRelations | null;
  defaultDate?: string;
}

export function WorkerScheduleForm({ open, onOpenChange, schedule, defaultDate }: WorkerScheduleFormProps) {
  const { data: workers } = useWorkers();
  const createMutation = useCreateWorkerSchedule();
  const updateMutation = useUpdateWorkerSchedule();

  const isEdit = !!schedule;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      worker_id: "",
      schedule_date: defaultDate || format(new Date(), "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "10:00",
      work_title: "",
      location: "",
      remarks: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (schedule) {
        form.reset({
          worker_id: schedule.worker_id,
          schedule_date: schedule.schedule_date,
          start_time: schedule.start_time.substring(0, 5),
          end_time: schedule.end_time.substring(0, 5),
          work_title: schedule.work_title,
          location: schedule.location || "",
          remarks: schedule.remarks || "",
        });
      } else {
        form.reset({
          worker_id: "",
          schedule_date: defaultDate || format(new Date(), "yyyy-MM-dd"),
          start_time: "09:00",
          end_time: "10:00",
          work_title: "",
          location: "",
          remarks: "",
        });
      }
    }
  }, [open, schedule, form, defaultDate]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: schedule.id, updates: values });
        toast.add({ title: "Success", description: "Schedule updated successfully." });
      } else {
        await createMutation.mutateAsync({
          ...values,
          schedule_status: "Scheduled",
          work_task_id: null,
          template_id: null,
          work_description: null,
          location: values.location || null,
          remarks: values.remarks || null,
        });
        toast.add({ title: "Success", description: "Schedule created successfully." });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.add({ 
        title: "Error", 
        description: error.message || "Failed to save schedule.", 
        type: "error" 
      });
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Schedule" : "New Schedule Block"}
      description="Assign a time block to a worker."
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={createMutation.isPending || updateMutation.isPending}
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="worker_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Worker</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker">
                        {workers?.find(w => w.id === field.value)?.name || "Select worker"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workers?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name} ({w.employee_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="schedule_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="work_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Morning Cleaning" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Ground Floor Reception" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Input placeholder="Optional notes" {...field} value={field.value || ""} />
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
