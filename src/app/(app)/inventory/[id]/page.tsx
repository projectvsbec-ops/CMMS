"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, ArrowRightLeft, Package, AlertTriangle, Building, Tag, DollarSign, MapPin } from "lucide-react";
import { InventoryItemForm } from "@/features/inventory/components/inventory-item-form";
import { InventoryTransactionForm } from "@/features/inventory/components/inventory-transaction-form";
import { useInventoryItem, useInventoryTransactions } from "@/features/inventory/queries";
import type { InventoryTransactionWithRelations } from "@/types";

export default function InventoryItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const { data: item, isLoading, error } = useInventoryItem(itemId);
  const { data: transactions, isLoading: isTransactionsLoading } = useInventoryTransactions(itemId);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton />;
  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold mb-2">Item Not Found</h2>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const isOut = item.current_stock <= 0;
  const isLow = item.current_stock <= item.reorder_level && !isOut;

  const transactionColumns = [
    {
      key: "created_at",
      header: "Date",
      cell: (tx: InventoryTransactionWithRelations) => <span className="text-sm">{format(new Date(tx.created_at), "PP p")}</span>,
    },
    {
      key: "transaction_type",
      header: "Type",
      cell: (tx: InventoryTransactionWithRelations) => {
        switch(tx.transaction_type) {
          case "stock_in": return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Stock In</Badge>;
          case "stock_out": return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Stock Out</Badge>;
          case "adjustment": return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Adjustment</Badge>;
          case "return": return <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">Return</Badge>;
        }
      },
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (tx: InventoryTransactionWithRelations) => {
        const sign = (tx.transaction_type === "stock_out" || (tx.transaction_type === "adjustment" && tx.quantity < 0)) ? "-" : "+";
        const color = sign === "-" ? "text-destructive" : "text-green-600";
        return <span className={`font-semibold ${color}`}>{sign}{Math.abs(tx.quantity)} {item.unit}</span>;
      },
    },
    {
      key: "work_task",
      header: "Linked Task",
      cell: (tx: InventoryTransactionWithRelations) => tx.work_task ? (
        <span className="text-sm text-primary hover:underline cursor-pointer" onClick={() => router.push(`/work/${tx.work_task!.id}`)}>
          {tx.work_task.task_number}
        </span>
      ) : "-",
    },
    {
      key: "remarks",
      header: "Remarks",
      cell: (tx: InventoryTransactionWithRelations) => <span className="text-sm truncate max-w-[200px] block" title={tx.remarks || ""}>{tx.remarks || "-"}</span>,
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => router.push("/inventory")}>
          Inventory
        </span>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate max-w-[200px]">{item.item_code}</span>
      </div>

      <PageHeader
        title={item.name}
        description={`Code: ${item.item_code} • Added on ${format(new Date(item.created_at), "PPP")}`}
      >
        <div className="flex gap-2">
          <Button onClick={() => setIsTransactionOpen(true)} className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Record Transaction
          </Button>
          <Button variant="outline" onClick={() => setIsFormOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Item
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-1">
          {/* Stock Info Card */}
          <Card className={`${isOut ? 'border-destructive' : isLow ? 'border-amber-500' : ''}`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Current Stock
                </span>
                {isOut && <Badge variant="destructive">Out of Stock</Badge>}
                {isLow && <Badge className="bg-amber-500">Low Stock</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1">{item.current_stock}</div>
              <p className="text-muted-foreground text-sm uppercase tracking-wide">{item.unit}</p>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Reorder Level</p>
                  <p className="font-medium">{item.reorder_level} {item.unit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Min / Max Stock</p>
                  <p className="font-medium">{item.minimum_stock} / {item.maximum_stock || "∞"} {item.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Category</p>
                  <p className="font-medium">{item.category?.name || "Uncategorized"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Department</p>
                  <p className="font-medium">{item.department?.name || "General"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Store Location</p>
                  <p className="font-medium">{item.store_location || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Unit Cost & Supplier</p>
                  <p className="font-medium">${item.unit_cost.toFixed(2)} • {item.supplier || "Unknown Supplier"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns}
                data={transactions || []}
                isLoading={isTransactionsLoading}
                emptyTitle="No transactions yet"
                emptyDescription="Stock operations will appear here."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <InventoryItemForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        item={item} 
      />

      {isTransactionOpen && (
        <InventoryTransactionForm
          open={isTransactionOpen}
          onOpenChange={setIsTransactionOpen}
          itemId={item.id}
        />
      )}
    </div>
  );
}
