// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { departmentSchema, type DepartmentFormValues } from "../schemas";
import { useCreateDepartment, useUpdateDepartment } from "../queries";
import { Department } from "@/types";
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

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
}

export function DepartmentForm({
  open,
  onOpenChange,
  department,
}: DepartmentFormProps) {
  const isEditing = !!department;
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "blue", // default
      icon: "Circle",
      is_active: true,
    },
  });

  // Reset form when department changes
  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        description: department.description || "",
        color: department.color || "blue",
        icon: department.icon || "Circle",
        is_active: department.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        color: "blue",
        icon: "Circle",
        is_active: true,
      });
    }
  }, [department, form]);

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: department.id,
          ...values,
        } as any);
        toast.add({
          title: "Department updated",
          description: "The department was successfully updated.",
        });
      } else {
        await createMutation.mutateAsync(values as any);
        toast.add({
          title: "Department created",
          description: "The new department was successfully created.",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.add({
        title: "Error",
        description: error.message || "Failed to save department.",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Department" : "Add Department"}
      description={
        isEditing
          ? "Update department details."
          : "Create a new department in the system."
      }
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Form {...(form as any)}>
        <div className="space-y-4">
          <FormField
            control={form.control as any}
            name="name"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Electrical" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of this department..."
                    className="resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Color & Icon fields omitted for simplicity in this iteration, 
              can be added later using a popover select if needed. */}
        </div>
      </Form>
    </FormSheet>
  );
}
