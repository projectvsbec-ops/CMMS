"use client";

import { useInventoryItems } from "@/features/inventory/queries";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { InventoryItemWithRelations } from "@/types";

interface DepartmentInventoryListProps {
  departmentId: string;
}

export function DepartmentInventoryList({ departmentId }: DepartmentInventoryListProps) {
  const { data: items, isLoading } = useInventoryItems({ departmentId });

  const columns: DataTableColumn<InventoryItemWithRelations>[] = [
    {
      key: "item_code",
      header: "Item Code",
      cell: (item) => <span className="font-medium text-muted-foreground">{item.item_code}</span>,
    },
    {
      key: "name",
      header: "Item Name",
      cell: (item) => <span className="font-semibold">{item.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      cell: (item) => item.category ? item.category.name : "-",
    },
    {
      key: "current_stock",
      header: "Stock",
      cell: (item) => {
        const isOut = item.current_stock <= 0;
        const isLow = item.current_stock <= item.reorder_level && !isOut;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{item.current_stock} {item.unit}</span>
            {isOut && <span className="text-xs font-semibold text-destructive uppercase">Out of Stock</span>}
            {isLow && <span className="text-xs font-semibold text-amber-500 uppercase">Low Stock</span>}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <Badge variant={item.is_active ? "outline" : "secondary"} className={item.is_active ? "border-green-500 text-green-700 bg-green-50" : ""}>
          {item.is_active ? "Active" : "Archived"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Department Inventory</h3>
      <DataTable
        data={items || []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No inventory items allocated to this department."
      />
    </div>
  );
}
