"use client";

import { useState } from "react";
import { useManagers, useUpdateManager, useDeleteManager } from "@/features/managers/queries";
import { useDepartments } from "@/features/departments/queries";
import { ManagerWithDepartment } from "@/features/managers/api";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ManagerForm } from "@/features/managers/components/manager-form";
import { toast } from "@/components/ui/toast";
import { FileEdit, Archive, ShieldAlert, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const MANAGER_STATUSES = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "On Leave", value: "on_leave" },
];

export default function ManagersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<ManagerWithDepartment | null>(null);
  const [managerToArchive, setManagerToArchive] = useState<ManagerWithDepartment | null>(null);
  const [managerToDelete, setManagerToDelete] = useState<ManagerWithDepartment | null>(null);

  const { data: managers, isLoading } = useManagers();
  const { data: departments } = useDepartments();
  const updateMutation = useUpdateManager();
  const deleteMutation = useDeleteManager();

  const filteredManagers = managers?.filter((m) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      m.name.toLowerCase().includes(searchLower) ||
      (m.employee_id && m.employee_id.toLowerCase().includes(searchLower)) ||
      (m.phone && m.phone.includes(searchLower));
      
    const matchesDept = departmentFilter === "all" || m.department_id === departmentFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleEdit = (manager: ManagerWithDepartment) => {
    setSelectedManager(manager);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedManager(null);
    setIsFormOpen(true);
  };

  const handleArchive = async () => {
    if (!managerToArchive) return;

    try {
      await updateMutation.mutateAsync({
        id: managerToArchive.id,
        updates: {
          status: managerToArchive.status === "active" ? "inactive" : "active",
        }
      });
      toast.add({
        title: managerToArchive.status === "active" ? "Manager archived" : "Manager restored",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to update manager status",
        type: "error",
      });
    } finally {
      setManagerToArchive(null);
    }
  };

  const handleDelete = async () => {
    if (!managerToDelete) return;

    try {
      await deleteMutation.mutateAsync(managerToDelete.id);
      toast.add({
        title: "Manager deleted",
        description: "The manager has been permanently removed.",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to delete manager. They may have dependent records (like assigned tasks).",
        type: "error",
      });
    } finally {
      setManagerToDelete(null);
    }
  };

  const columns: DataTableColumn<ManagerWithDepartment>[] = [
    {
      header: "Employee ID",
      accessorKey: "employee_id",
      cell: (item) => (
        <span className="font-mono text-xs">{item.employee_id || "-"}</span>
      ),
    },
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
        <span className="text-sm">{item.department?.name || "-"}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => (
        <StatusBadge
          type="worker"
          value={item.status}
        />
      ),
    },
  ];

  const actions = (item: ManagerWithDepartment) => [
    {
      label: "Edit",
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => handleEdit(item),
    },
    {
      label: item.status === "active" ? "Archive" : "Restore",
      icon: item.status === "active" ? (
        <Archive className="h-4 w-4" />
      ) : (
        <ShieldAlert className="h-4 w-4" />
      ),
      onClick: () => setManagerToArchive(item),
      destructive: item.status === "active",
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setManagerToDelete(item),
      destructive: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Managers"
        description="Manage departmental supervisors and task managers"
        action={{
          label: "Add Manager",
          onClick: handleAddNew,
        }}
      />

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <SearchInput
          placeholder="Search by name, ID, phone..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="w-full xl:max-w-xs"
        />
        
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <select
            className="h-9 w-full sm:w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

          <select
            className="h-9 w-full sm:w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {MANAGER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredManagers || []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        actions={actions}
        emptyMessage="No managers found matching your filters."
      />

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{selectedManager ? "Edit Manager" : "Add New Manager"}</SheetTitle>
            <SheetDescription>
              {selectedManager ? "Update manager details below." : "Fill out the form below to register a new manager."}
            </SheetDescription>
          </SheetHeader>
          <ManagerForm 
            manager={selectedManager || undefined} 
            onSuccess={() => setIsFormOpen(false)} 
          />
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!managerToArchive}
        onOpenChange={(open) => !open && setManagerToArchive(null)}
        title={managerToArchive?.status === "active" ? "Archive Manager" : "Restore Manager"}
        description={
          managerToArchive?.status === "active"
            ? "Are you sure you want to archive this manager? They will no longer appear in active assignments."
            : "Are you sure you want to restore this manager? They will be active again."
        }
        confirmLabel={managerToArchive?.status === "active" ? "Archive" : "Restore"}
        variant={managerToArchive?.status === "active" ? "destructive" : "default"}
        isLoading={updateMutation.isPending}
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={!!managerToDelete}
        onOpenChange={(open) => !open && setManagerToDelete(null)}
        title="Delete Manager"
        description="Are you absolutely sure you want to permanently delete this manager? This action cannot be undone."
        confirmLabel="Delete Permanently"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
