// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { areaSchema, type AreaFormValues } from "../schemas";
import { useCreateArea, useUpdateArea } from "../queries";
import { useDepartments } from "@/features/departments/queries";
import { Area } from "@/types";
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

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: Area | null;
}

export function AreaForm({ open, onOpenChange, area }: AreaFormProps) {
  const isEditing = !!area;
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea();
  const { data: departments, isLoading: isDepartmentsLoading } = useDepartments();

  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      department_id: "",
      name: "",
      description: "",
      is_active: true,
    },
  });

  // Reset form when area changes
  useEffect(() => {
    if (area) {
      form.reset({
        department_id: area.department_id,
        name: area.name,
        description: area.description || "",
        is_active: area.is_active,
      });
    } else {
      form.reset({
        department_id: "",
        name: "",
        description: "",
        is_active: true,
      });
    }
  }, [area, form]);

  const onSubmit = async (values: AreaFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: area.id,
          ...values,
        } as any);
        toast.add({
          title: "Area updated",
          description: "The area was successfully updated.",
        });
      } else {
        await createMutation.mutateAsync(values as any);
        toast.add({
          title: "Area created",
          description: "The new area was successfully created.",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.add({
        title: "Error",
        description: error.message || "Failed to save area. Check for duplicates.",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Area" : "Add Area"}
      description={
        isEditing
          ? "Update area details."
          : "Create a new area in the system."
      }
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Form {...(form as any)}>
        <div className="space-y-4">
          <FormField
            control={form.control as any}
            name="department_id"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    {...field}
                    disabled={isDepartmentsLoading}
                  >
                    <option value="" disabled>Select a department</option>
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
            name="name"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Area Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. MB-1, Main Panel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="description"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of this area..."
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
