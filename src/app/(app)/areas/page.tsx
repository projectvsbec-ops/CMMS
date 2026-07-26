"use client";

import { useState } from "react";
import { useAreas, useUpdateArea } from "@/features/areas/queries";
import { useDepartments } from "@/features/departments/queries";
import { AreaWithDepartment } from "@/features/areas/api";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AreaForm } from "@/features/areas/components/area-form";
import { toast } from "@/components/ui/toast";
import { FileEdit, Archive, ShieldAlert } from "lucide-react";

export default function AreasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaWithDepartment | null>(null);
  const [areaToArchive, setAreaToArchive] = useState<AreaWithDepartment | null>(null);

  const { data: areas, isLoading } = useAreas();
  const { data: departments } = useDepartments();
  const updateMutation = useUpdateArea();

  const filteredAreas = areas?.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === "all" || a.department_id === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleEdit = (area: AreaWithDepartment) => {
    setSelectedArea(area);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedArea(null);
    setIsFormOpen(true);
  };

  const handleArchive = async () => {
    if (!areaToArchive) return;

    try {
      await updateMutation.mutateAsync({
        id: areaToArchive.id,
        is_active: !areaToArchive.is_active,
      });
      toast.add({
        title: areaToArchive?.is_active ? "Area archived" : "Area restored",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to update area status",
        type: "error",
      });
    } finally {
      setAreaToArchive(null);
    }
  };

  const columns: DataTableColumn<AreaWithDepartment>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (item) => (
        <span className="font-medium text-foreground">{item.name}</span>
      ),
    },
    {
      header: "Department",
      accessorKey: "department.name",
      cell: (item) => (
        <span className="text-muted-foreground">{item.department?.name || "-"}</span>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (item) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {item.description || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (item) => (
        <StatusBadge
          type="worker"
          value={item.is_active ? "active" : "inactive"}
        />
      ),
    },
  ];

  const actions = (item: AreaWithDepartment) => [
    {
      label: "Edit",
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => handleEdit(item),
    },
    {
      label: item.is_active ? "Archive" : "Restore",
      icon: item.is_active ? (
        <Archive className="h-4 w-4" />
      ) : (
        <ShieldAlert className="h-4 w-4" />
      ),
      onClick: () => setAreaToArchive(item),
      destructive: item.is_active,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Areas"
        description="Manage campus areas within departments"
        action={{
          label: "Add Area",
          onClick: handleAddNew,
        }}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <SearchInput
          placeholder="Search areas..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="w-full sm:max-w-xs"
        />
        
        {/* Simple native select for department filter */}
        <select
          className="h-9 w-full sm:w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments?.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredAreas || []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        actions={actions}
        emptyMessage="No areas found."
      />

      <AreaForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        area={selectedArea}
      />

      <ConfirmDialog
        open={!!areaToArchive}
        onOpenChange={(open) => !open && setAreaToArchive(null)}
        title={areaToArchive?.is_active ? "Archive Area" : "Restore Area"}
        description={
          areaToArchive?.is_active
            ? `Are you sure you want to archive ${areaToArchive.name}?`
            : `Are you sure you want to restore ${areaToArchive?.name}?`
        }
        confirmLabel={areaToArchive?.is_active ? "Archive" : "Restore"}
        variant={areaToArchive?.is_active ? "destructive" : "default"}
        isLoading={updateMutation.isPending}
        onConfirm={handleArchive}
      />
    </div>
  );
}
