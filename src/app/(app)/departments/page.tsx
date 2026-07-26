"use client";

import { useState } from "react";
import { useDepartments, useUpdateDepartment } from "@/features/departments/queries";
import { Department } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DepartmentForm } from "@/features/departments/components/department-form";
import { toast } from "@/components/ui/toast";
import { FileEdit, Archive, ShieldAlert } from "lucide-react";
import { useIsMobile } from "@/hooks/use-media-query";

import { useRouter } from "next/navigation";

export default function DepartmentsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentToArchive, setDepartmentToArchive] = useState<Department | null>(null);

  const { data: departments, isLoading } = useDepartments();
  const updateMutation = useUpdateDepartment();

  const filteredDepartments = departments?.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedDepartment(null);
    setIsFormOpen(true);
  };

  const handleArchive = async () => {
    if (!departmentToArchive) return;

    try {
      await updateMutation.mutateAsync({
        id: departmentToArchive.id,
        is_active: !departmentToArchive.is_active,
      });
      toast.add({
        title: departmentToArchive.is_active ? "Department archived" : "Department restored",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to update department status",
        type: "error",
      });
    } finally {
      setDepartmentToArchive(null);
    }
  };

  const columns: DataTableColumn<Department>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (item) => (
        <span className="font-medium text-foreground">{item.name}</span>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (item) => (
        <span className="text-muted-foreground truncate max-w-[300px] block">
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

  const actions = (item: Department) => [
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
      onClick: () => setDepartmentToArchive(item),
      destructive: item.is_active,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage campus maintenance departments"
        action={{
          label: "Add Department",
          onClick: handleAddNew,
        }}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <SearchInput
          placeholder="Search departments..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="w-full sm:max-w-xs"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredDepartments || []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        actions={actions}
        emptyMessage="No departments found."
        onRowClick={(item) => router.push(`/departments/${item.id}`)}
      />

      <DepartmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        department={selectedDepartment}
      />

      <ConfirmDialog
        open={!!departmentToArchive}
        onOpenChange={(open) => !open && setDepartmentToArchive(null)}
        title={departmentToArchive?.is_active ? "Archive Department" : "Restore Department"}
        description={
          departmentToArchive?.is_active
            ? `Are you sure you want to archive ${departmentToArchive.name}? This will hide it from normal views but keep it in the database.`
            : `Are you sure you want to restore ${departmentToArchive?.name}?`
        }
        confirmLabel={departmentToArchive?.is_active ? "Archive" : "Restore"}
        variant={departmentToArchive?.is_active ? "destructive" : "default"}
        isLoading={updateMutation.isPending}
        onConfirm={handleArchive}
      />
    </div>
  );
}
