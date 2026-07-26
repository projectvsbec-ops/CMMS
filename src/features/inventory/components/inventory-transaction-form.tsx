// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecordTransaction, useInventoryItem } from "../queries";
import type { TransactionType } from "@/types";
import { toast } from "@/components/ui/toast";

const formSchema = z.object({
  transaction_type: z.enum(["stock_in", "stock_out", "adjustment", "return"]),
  quantity: z.coerce.number(),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  defaultType?: TransactionType;
  linkedTaskId?: string;
}

export function InventoryTransactionForm({ open, onOpenChange, itemId, defaultType = "stock_in", linkedTaskId }: InventoryTransactionFormProps) {
  const { data: item } = useInventoryItem(itemId);
  const recordMutation = useRecordTransaction();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_type: defaultType,
      quantity: 1,
      remarks: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        transaction_type: defaultType,
        quantity: 1,
        remarks: "",
      });
    }
  }, [open, defaultType, form]);

  const transactionType = form.watch("transaction_type");

  const onSubmit = async (values: FormValues) => {
    // Client side validation against negative stock for stock_out
    if (transactionType === "stock_out" && item && values.quantity > item.current_stock) {
      form.setError("quantity", { message: `Cannot issue more than current stock (${item.current_stock} ${item.unit})` });
      return;
    }
    // For adjustments, quantity can be negative or positive in standard systems, but our DB checks require > 0.
    // Wait, the DB trigger handles it by adding the adjustment amount. 
    // In our trigger: `ELSIF NEW.transaction_type = 'adjustment' THEN current_stock + NEW.quantity`.
    // So if the user wants to adjust down, they must provide a negative quantity?
    // But our UI requires > 0 and the DB constraint requires > 0 or adjustment. 
    // Wait, I altered the constraint to: `CHECK (quantity != 0 AND (quantity > 0 OR transaction_type = 'adjustment'))`
    // Let's change the zod schema to allow negative for adjustment!
    if (transactionType === "adjustment" && values.quantity === 0) {
      form.setError("quantity", { message: "Quantity cannot be zero." });
      return;
    }
    
    // If it's a stock out, ensure they aren't somehow passing a negative number directly.
    if (transactionType !== "adjustment" && values.quantity <= 0) {
      form.setError("quantity", { message: "Quantity must be greater than 0" });
      return;
    }

    try {
      await recordMutation.mutateAsync({
        inventory_item_id: itemId,
        transaction_type: values.transaction_type,
        quantity: values.quantity,
        remarks: values.remarks || null,
        work_task_id: linkedTaskId || null,
      });
      toast.add({ title: "Transaction Recorded", description: `Successfully recorded ${values.transaction_type}.` });
      onOpenChange(false);
    } catch (error: any) {
      toast.add({ title: "Transaction Failed", description: error.message || "Failed to record transaction.", type: "error" });
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Transaction</DialogTitle>
          <DialogDescription>
            Update stock for <span className="font-semibold text-foreground">{item.name}</span>. Current stock is {item.current_stock} {item.unit}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!linkedTaskId && defaultType === "stock_out"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stock_in">Stock In (+)</SelectItem>
                      <SelectItem value="stock_out">Stock Out (-)</SelectItem>
                      <SelectItem value="return">Return (+)</SelectItem>
                      <SelectItem value="adjustment">Adjustment (+/-)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity ({item.unit})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g. 10" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  {transactionType === "adjustment" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Use negative numbers to reduce stock via adjustment.
                    </p>
                  )}
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
                    <Textarea 
                      placeholder="Reason for transaction, PO number, etc..." 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordMutation.isPending}>
                {recordMutation.isPending ? "Recording..." : "Save Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
