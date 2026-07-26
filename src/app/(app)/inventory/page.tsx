"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Package, AlertTriangle, AlertOctagon, ExternalLink, ArrowRightLeft } from "lucide-react";
import { InventoryItemForm } from "@/features/inventory/components/inventory-item-form";
import { InventoryTransactionForm } from "@/features/inventory/components/inventory-transaction-form";
import { useInventoryDashboardStats as useDashboardQuery, useInventoryItems as useItemsQuery, useInventoryCategories as useCategoriesQuery } from "@/features/inventory/queries";
import { useDepartments } from "@/features/departments/queries";
import type { InventoryFilters } from "@/features/inventory/api";
import type { InventoryItemWithRelations } from "@/types";

export default function InventoryPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<InventoryFilters>({ status: "active" });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItemWithRelations | null>(null);
  const [itemForTransaction, setItemForTransaction] = useState<string | null>(null);

  const { data: departments } = useDepartments();
  const { data: categories } = useCategoriesQuery();
  const { data: items, isLoading } = useItemsQuery(filters);
  const { data: stats } = useDashboardQuery();

  const handleFilterChange = (key: keyof InventoryFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const openCreateForm = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: InventoryItemWithRelations) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };

  const openTransactionForm = (itemId: string) => {
    setItemForTransaction(itemId);
    setIsTransactionOpen(true);
  };

  const columns = [
    {
      key: "item_code",
      header: "Item Code",
      cell: (item: InventoryItemWithRelations) => <span className="font-medium text-muted-foreground">{item.item_code}</span>,
    },
    {
      key: "name",
      header: "Item Name",
      cell: (item: InventoryItemWithRelations) => <span className="font-semibold">{item.name}</span>,
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      cell: (item: InventoryItemWithRelations) => item.category ? (
        <span className="flex items-center gap-1.5 text-sm">
          <div className={`w-2 h-2 rounded-full ${item.category.color}`} />
          {item.category.name}
        </span>
      ) : "-",
    },
    {
      key: "current_stock",
      header: "Stock",
      cell: (item: InventoryItemWithRelations) => {
        const isOut = item.current_stock <= 0;
        const isLow = item.current_stock <= item.reorder_level && !isOut;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{item.current_stock} {item.unit}</span>
            {isOut && <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Out of Stock</span>}
            {isLow && <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Low Stock</span>}
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "store_location",
      header: "Location",
      cell: (item: InventoryItemWithRelations) => <span className="text-sm">{item.store_location || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (item: InventoryItemWithRelations) => (
        <Badge variant={item.is_active ? "outline" : "secondary"} className={item.is_active ? "border-green-500 text-green-700 bg-green-50" : ""}>
          {item.is_active ? "Active" : "Archived"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Inventory & Materials"
        description="Manage stock, issue materials, and track supplies."
        action={{
          label: "New Item",
          onClick: openCreateForm,
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Active Items"
          value={stats?.totalActiveItems ?? "-"}
          icon={Package}
          description="Total items tracked in inventory"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStock ?? "-"}
          icon={AlertTriangle}
          description="Items reaching reorder levels"
          trend={{ value: 100, isPositive: false }}
          className="border-amber-500/20 bg-amber-500/5"
        />
        <StatCard
          title="Out of Stock"
          value={stats?.outOfStock ?? "-"}
          icon={AlertOctagon}
          description="Items completely depleted"
          trend={{ value: 100, isPositive: false }}
          className="border-destructive/20 bg-destructive/5"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3 p-4 bg-muted/30 rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            placeholder="Search code or name..."
            value={filters.search || ""}
            onValueChange={(val) => handleFilterChange("search", val)}
            className="w-full bg-background"
          />
        </div>
        
        <div className="w-[150px] shrink-0">
          <Select value={filters.stockStatus || "all"} onValueChange={(val) => handleFilterChange("stockStatus", val)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Stock Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px] shrink-0">
          <Select value={filters.categoryId || "all"} onValueChange={(val) => handleFilterChange("categoryId", val)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px] shrink-0">
          <Select value={filters.departmentId || "all"} onValueChange={(val) => handleFilterChange("departmentId", val)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              {departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[120px] shrink-0">
          <Select value={filters.status || "active"} onValueChange={(val) => handleFilterChange("status", val)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items || []}
        isLoading={isLoading}
        emptyTitle="No items found"
        emptyDescription="Try adjusting your filters or create a new inventory item."
        onRowClick={(item) => router.push(`/inventory/${item.id}`)}
        actions={(item) => [
          {
            label: "Record Transaction",
            icon: <ArrowRightLeft className="h-4 w-4" />,
            onClick: () => openTransactionForm(item.id),
          },
          {
            label: "View Details",
            icon: <ExternalLink className="h-4 w-4" />,
            onClick: () => router.push(`/inventory/${item.id}`),
          },
        ]}
      />

      <InventoryItemForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        item={itemToEdit} 
      />

      {itemForTransaction && (
        <InventoryTransactionForm
          open={isTransactionOpen}
          onOpenChange={(v) => {
            setIsTransactionOpen(v);
            if (!v) setTimeout(() => setItemForTransaction(null), 200);
          }}
          itemId={itemForTransaction}
        />
      )}
    </div>
  );
}
