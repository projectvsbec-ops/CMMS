// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { FormSheet } from "@/components/shared/form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { useDepartments } from "@/features/departments/queries";
import { useAreas } from "@/features/areas/queries";
import { useWorkers } from "@/features/workers/queries";
import { useTaskCategories, useCreateWorkTask, useUpdateWorkTask } from "../queries";
import { TASK_PRIORITIES } from "@/lib/constants";
import type { WorkTaskWithRelations } from "@/types";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional().nullable(),
  department_id: z.string().min(1, "Department is required."),
  area_id: z.string().optional().nullable(),
  worker_id: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  target_date: z.string().optional().nullable(),
  identified_by: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: WorkTaskWithRelations | null;
}

export function WorkTaskForm({ open, onOpenChange, task }: WorkTaskFormProps) {
  const isEditing = !!task;

  const { data: departments } = useDepartments();
  const { data: areas } = useAreas();
  const { data: workers } = useWorkers();
  const { data: categories } = useTaskCategories();

  const createMutation = useCreateWorkTask();
  const updateMutation = useUpdateWorkTask();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      department_id: "",
      area_id: "",
      worker_id: "",
      category_id: "",
      priority: "medium",
      target_date: "",
      identified_by: "",
      remarks: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (task) {
        form.reset({
          title: task.title,
          description: task.description || "",
          department_id: task.department_id,
          area_id: task.area_id || "",
          worker_id: task.worker_id || "",
          category_id: task.category_id || "",
          priority: task.priority,
          target_date: task.target_date || "",
          identified_by: task.identified_by || "",
          remarks: task.remarks || "",
        });
      } else {
        form.reset({
          title: "",
          description: "",
          department_id: "",
          area_id: "",
          worker_id: "",
          category_id: "",
          priority: "medium",
          target_date: "",
          identified_by: "",
          remarks: "",
        });
      }
    }
  }, [open, task, form]);

  // Filter areas/workers by selected department
  const selectedDept = form.watch("department_id");
  const filteredAreas = areas?.filter((a) => a.department_id === selectedDept) || [];
  const filteredWorkers = workers?.filter((w) => w.department_id === selectedDept && w.status === "active") || [];

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || null,
      department_id: values.department_id,
      area_id: values.area_id || null,
      worker_id: values.worker_id || null,
      category_id: values.category_id || null,
      priority: values.priority,
      target_date: values.target_date || null,
      identified_by: values.identified_by || null,
      remarks: values.remarks || null,
      status: task?.status || (values.worker_id ? "assigned" : "pending"), // auto transition based on worker
    };

    if (isEditing && task) {
      await updateMutation.mutateAsync({ id: task.id, updates: payload });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    
    onOpenChange(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Task" : "Create Task"}
      description={isEditing ? "Update task details." : "Create a new maintenance task."}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isPending}
    >
      <Form {...form}>
        <div className="space-y-4 px-1">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nature of Work (Title)</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Fix leaking pipe in washroom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detailed description..." className="resize-none" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); form.setValue("area_id", ""); form.setValue("worker_id", ""); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dept">
                          {field.value ? (departments?.find(d => d.id === field.value)?.name || "Select dept") : "Select dept"}
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
                  <FormLabel>Area</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedDept}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area">
                          {field.value ? (filteredAreas.find(a => a.id === field.value)?.name || "Select area") : "Select area"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredAreas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category">
                          {field.value ? (categories?.find(c => c.id === field.value)?.name || "Select category") : "Select category"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="worker_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Worker</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedDept}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker (optional)">
                        {field.value ? (filteredWorkers.find(w => w.id === field.value)?.name || "Select worker (optional)") : "Select worker (optional)"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredWorkers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name} ({w.employee_id})</SelectItem>
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
              name="target_date"
              render={({ field }) => (
                <FormItem className="flex flex-col mt-2">
                  <FormLabel className="mb-1">Target Date</FormLabel>
                  <Popover>
                    <PopoverTrigger render={
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-9",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    } />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identified_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identified By</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Prof. Smith" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Remarks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Internal notes..." className="resize-none h-20" {...field} value={field.value || ""} />
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
