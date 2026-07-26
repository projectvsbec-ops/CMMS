"use client";

import { useState } from "react";
import { format } from "date-fns";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAttendanceHistory } from "../queries";
import { AttendanceHistoryFilters } from "../api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDepartments } from "@/features/departments/queries";
import { useAreas } from "@/features/areas/queries";
import { useWorkers } from "@/features/workers/queries";
import type { AttendanceWithWorker } from "@/types";

export function AttendanceHistoryView() {
  const [filters, setFilters] = useState<AttendanceHistoryFilters>({});
  
  const { data: history, isLoading } = useAttendanceHistory(filters);
  const { data: departments } = useDepartments();
  const { data: areas } = useAreas();
  const { data: workers } = useWorkers();

  const handleFilterChange = (key: keyof AttendanceHistoryFilters, value: string | undefined) => {
    setFilters((prev: AttendanceHistoryFilters) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const columns: DataTableColumn<AttendanceWithWorker>[] = [
    {
      key: "date",
      header: "Date",
      cell: (item) => format(new Date(item.attendance_date), "MMM dd, yyyy"),
      sortable: true,
    },
    {
      key: "employee",
      header: "Employee",
      cell: (item) => (
        <div>
          <p className="font-semibold">{item.worker?.name}</p>
          <p className="text-xs text-muted-foreground">{item.worker?.employee_id}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department / Area",
      cell: (item) => (
        <div>
          <p>{item.worker?.department?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">{item.worker?.area?.name || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => <StatusBadge type="attendance" value={item.status} />,
    },
    {
      key: "remarks",
      header: "Remarks",
      cell: (item) => <span className="text-sm text-muted-foreground">{item.remarks || "-"}</span>,
    }
  ];

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex-1 min-w-[200px] w-full">
          <label className="text-xs font-medium mb-1 block">Search</label>
          <SearchInput
            placeholder="Search name or ID..."
            value={filters.search || ""}
            onValueChange={(val) => handleFilterChange("search", val)}
            className="w-full bg-background"
          />
        </div>
        
        <div className="w-full md:w-[150px]">
          <label className="text-xs font-medium mb-1 block">Status</label>
          <Select value={filters.status || "all"} onValueChange={(val) => handleFilterChange("status", val ?? undefined)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
              <SelectItem value="half_day">Half Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-[160px]">
          <label className="text-xs font-medium mb-1 block">Department</label>
          <Select value={filters.departmentId || "all"} onValueChange={(val) => handleFilterChange("departmentId", val ?? undefined)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Depts">
                {filters.departmentId && filters.departmentId !== "all" ? (departments?.find(d => d.id === filters.departmentId)?.name || "All Depts") : "All Depts"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              {departments?.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-[160px]">
          <label className="text-xs font-medium mb-1 block">Area</label>
          <Select value={filters.areaId || "all"} onValueChange={(val) => handleFilterChange("areaId", val ?? undefined)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Areas">
                {filters.areaId && filters.areaId !== "all" ? (areas?.find(a => a.id === filters.areaId)?.name || "All Areas") : "All Areas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas?.filter(a => !filters.departmentId || a.department_id === filters.departmentId).map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={history || []}
        isLoading={isLoading}
        emptyMessage="No attendance records found matching filters."
      />
    </div>
  );
}
