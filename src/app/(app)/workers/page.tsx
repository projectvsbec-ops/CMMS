"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkers, useUpdateWorker, useDeleteWorker } from "@/features/workers/queries";
import { useDepartments } from "@/features/departments/queries";
import { useAreas } from "@/features/areas/queries";
import { WorkerWithRelations } from "@/features/workers/api";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { WorkerForm } from "@/features/workers/components/worker-form";
import { toast } from "@/components/ui/toast";
import { FileEdit, Archive, ShieldAlert, Eye, Trash2 } from "lucide-react";
import { WORKER_STATUSES } from "@/lib/constants";

export default function WorkersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithRelations | null>(null);
  const [workerToArchive, setWorkerToArchive] = useState<WorkerWithRelations | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<WorkerWithRelations | null>(null);

  const { data: workers, isLoading } = useWorkers();
  const { data: departments } = useDepartments();
  const { data: areas } = useAreas();
  const updateMutation = useUpdateWorker();
  const deleteMutation = useDeleteWorker();

  const availableAreas = areas?.filter(
    (area) => departmentFilter === "all" || area.department_id === departmentFilter
  );

  const filteredWorkers = workers?.filter((w) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      w.name.toLowerCase().includes(searchLower) ||
      w.employee_id.toLowerCase().includes(searchLower) ||
      (w.phone && w.phone.includes(searchLower));
      
    const matchesDept = departmentFilter === "all" || w.department_id === departmentFilter;
    const matchesArea = areaFilter === "all" || w.area_id === areaFilter;
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    
    return matchesSearch && matchesDept && matchesArea && matchesStatus;
  });

  const handleEdit = (worker: WorkerWithRelations) => {
    setSelectedWorker(worker);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedWorker(null);
    setIsFormOpen(true);
  };

  const handleView = (worker: WorkerWithRelations) => {
    router.push(`/workers/${worker.id}`);
  };

  const handleArchive = async () => {
    if (!workerToArchive) return;

    try {
      await updateMutation.mutateAsync({
        id: workerToArchive.id,
        status: workerToArchive.status === "active" ? "inactive" : "active",
      });
      toast.add({
        title: workerToArchive.status === "active" ? "Worker archived" : "Worker restored",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to update worker status",
        type: "error",
      });
    } finally {
      setWorkerToArchive(null);
    }
  };

  const handleDelete = async () => {
    if (!workerToDelete) return;

    try {
      await deleteMutation.mutateAsync(workerToDelete.id);
      toast.add({
        title: "Worker deleted",
        description: "The worker has been permanently removed.",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to delete worker. They may have dependent records (like attendance).",
        type: "error",
      });
    } finally {
      setWorkerToDelete(null);
    }
  };

  const columns: DataTableColumn<WorkerWithRelations>[] = [
    {
      header: "Employee ID",
      accessorKey: "employee_id",
      cell: (item) => (
        <span className="font-mono text-xs">{item.employee_id}</span>
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
      header: "Department / Area",
      accessorKey: "department.name",
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-sm">{item.department?.name || "-"}</span>
          <span className="text-xs text-muted-foreground">{item.area?.name || "No Area"}</span>
        </div>
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

  const actions = (item: WorkerWithRelations) => [
    {
      label: "View Profile",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => handleView(item),
    },
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
      onClick: () => setWorkerToArchive(item),
      destructive: item.status === "active",
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setWorkerToDelete(item),
      destructive: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workers"
        description="Manage maintenance staff across departments"
        action={{
          label: "Add Worker",
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
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setAreaFilter("all"); // Reset area when dept changes
            }}
          >
            <option value="all">All Departments</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 w-full sm:w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            disabled={departmentFilter === "all" && (!availableAreas || availableAreas.length === 0)}
          >
            <option value="all">All Areas</option>
            {availableAreas?.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 w-full sm:w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {WORKER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredWorkers || []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        actions={actions}
        emptyMessage="No workers found matching your filters."
      />

      <WorkerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        worker={selectedWorker}
      />

      <ConfirmDialog
        open={!!workerToArchive}
        onOpenChange={(open) => !open && setWorkerToArchive(null)}
        title={workerToArchive?.status === "active" ? "Archive Worker" : "Restore Worker"}
        description={
          workerToArchive?.status === "active"
            ? "Are you sure you want to archive this worker? They will no longer appear in active assignments."
            : "Are you sure you want to restore this worker? They will be active again."
        }
        confirmLabel={workerToArchive?.status === "active" ? "Archive" : "Restore"}
        variant={workerToArchive?.status === "active" ? "destructive" : "default"}
        isLoading={updateMutation.isPending}
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={!!workerToDelete}
        onOpenChange={(open) => !open && setWorkerToDelete(null)}
        title="Delete Worker"
        description="Are you absolutely sure you want to permanently delete this worker? This action cannot be undone. If they have historical attendance or schedules, you should Archive them instead."
        confirmLabel="Delete Permanently"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
