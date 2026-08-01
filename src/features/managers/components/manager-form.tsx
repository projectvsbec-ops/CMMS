"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ManagerFormValues, managerFormSchema } from "../schemas";
import { useCreateManager, useUpdateManager } from "../queries";
import { useDepartments } from "@/features/departments/queries";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Manager } from "@/types";

interface ManagerFormProps {
  manager?: Manager;
  onSuccess?: () => void;
}

export function ManagerForm({ manager, onSuccess }: ManagerFormProps) {
  const createMutation = useCreateManager();
  const updateMutation = useUpdateManager();
  const { data: departments, isLoading: isLoadingDeps } = useDepartments();

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      name: manager?.name || "",
      employee_id: manager?.employee_id || "",
      department_id: manager?.department_id || "",
      phone: manager?.phone || "",
      email: manager?.email || "",
      joining_date: manager?.joining_date || format(new Date(), "yyyy-MM-dd"),
      status: manager?.status || "active",
      notes: manager?.notes || "",
      is_active: manager?.is_active ?? true,
    },
  });

  const onSubmit = async (values: ManagerFormValues) => {
    try {
      const payload = {
        ...values,
        employee_id: values.employee_id || null,
        phone: values.phone || null,
        email: values.email || null,
        notes: values.notes || null,
        is_active: values.is_active ?? true,
      };

      if (manager) {
        await updateMutation.mutateAsync({ id: manager.id, updates: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="MGR-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  disabled={isLoadingDeps}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department">
                        {field.value ? departments?.find(d => d.id === field.value)?.name || "Select a department" : "Select a department"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="joining_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Joining Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
              <FormLabel>Notes / Designation</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Senior Maintenance Manager..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : manager ? "Update Manager" : "Add Manager"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
