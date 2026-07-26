// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { FormSheet } from "@/components/shared/form-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDepartments } from "@/features/departments/queries";
import { useInventoryCategories, useCreateInventoryItem, useUpdateInventoryItem } from "../queries";
import { INVENTORY_UNITS } from "@/lib/constants";
import type { InventoryItemWithRelations } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  category_id: z.string().min(1, "Category is required."),
  department_id: z.string().optional().nullable(),
  unit: z.string().min(1, "Unit is required."),
  minimum_stock: z.coerce.number().min(0, "Cannot be negative"),
  maximum_stock: z.coerce.number().optional().nullable(),
  reorder_level: z.coerce.number().min(0, "Cannot be negative"),
  store_location: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  unit_cost: z.coerce.number().min(0, "Cannot be negative"),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItemWithRelations | null;
}

export function InventoryItemForm({ open, onOpenChange, item }: InventoryItemFormProps) {
  const isEditing = !!item;

  const { data: departments } = useDepartments();
  const { data: categories } = useInventoryCategories();

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_id: "",
      department_id: "",
      unit: "Pieces",
      minimum_stock: 0,
      maximum_stock: null,
      reorder_level: 0,
      store_location: "",
      supplier: "",
      unit_cost: 0,
      remarks: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          name: item.name,
          category_id: item.category_id || "",
          department_id: item.department_id || "",
          unit: item.unit,
          minimum_stock: item.minimum_stock,
          maximum_stock: item.maximum_stock,
          reorder_level: item.reorder_level,
          store_location: item.store_location || "",
          supplier: item.supplier || "",
          unit_cost: item.unit_cost,
          remarks: item.remarks || "",
        });
      } else {
        form.reset({
          name: "",
          category_id: "",
          department_id: "",
          unit: "Pieces",
          minimum_stock: 0,
          maximum_stock: null,
          reorder_level: 0,
          store_location: "",
          supplier: "",
          unit_cost: 0,
          remarks: "",
        });
      }
    }
  }, [open, item, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      category_id: values.category_id || null,
      department_id: values.department_id || null,
      unit: values.unit,
      minimum_stock: values.minimum_stock,
      maximum_stock: values.maximum_stock || null,
      reorder_level: values.reorder_level,
      store_location: values.store_location || null,
      supplier: values.supplier || null,
      unit_cost: values.unit_cost,
      remarks: values.remarks || null,
    };

    if (isEditing && item) {
      await updateMutation.mutateAsync({ id: item.id, updates: payload });
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
      title={isEditing ? "Edit Item" : "Create Inventory Item"}
      description={isEditing ? "Update item details." : "Add a new item to the inventory catalog."}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isPending}
    >
      <Form {...form}>
        <div className="space-y-4 px-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., LED Bulb 9W" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                        <SelectValue placeholder="Select...">
                          {field.value ? (categories?.find(c => c.id === field.value)?.name || "Select...") : "Select..."}
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
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All Depts">
                          {field.value ? (departments?.find(d => d.id === field.value)?.name || "All Depts") : "None / General"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None / General</SelectItem>
                      {departments?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INVENTORY_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="unit_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="reorder_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Lvl</FormLabel>
                  <FormControl><Input type="number" min="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimum_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Stock</FormLabel>
                  <FormControl><Input type="number" min="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maximum_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Stock</FormLabel>
                  <FormControl><Input type="number" min="0" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="store_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Location</FormLabel>
                  <FormControl><Input placeholder="E.g., Rack A1" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl><Input placeholder="E.g., Acme Corp" {...field} value={field.value || ""} /></FormControl>
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
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional notes..." className="resize-none" {...field} value={field.value || ""} />
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
