"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { useDailyAttendance, useUpsertAttendanceBatch } from "../queries";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { useToastManager } from "@base-ui/react/toast";
import type { AttendanceStatus, WorkerWithRelations, AttendanceInsert } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

interface DailyAttendanceViewProps {
  initialDate?: Date;
  departmentId?: string;
}

type DraftRecord = {
  status: AttendanceStatus | null;
  remarks: string | null;
};

export function DailyAttendanceView({ initialDate = new Date(), departmentId }: DailyAttendanceViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  
  const { data: attendanceData, isLoading } = useDailyAttendance(formattedDate, departmentId);
  const upsertMutation = useUpsertAttendanceBatch();

  // Local draft state keyed by worker ID
  const [draft, setDraft] = useState<Record<string, DraftRecord>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Sync draft when query data loads
  useEffect(() => {
    if (attendanceData) {
      const newDraft: Record<string, DraftRecord> = {};
      attendanceData.forEach((item) => {
        newDraft[item.worker.id] = {
          status: item.status as AttendanceStatus,
          remarks: item.remarks,
        };
      });
      setDraft(newDraft);
      setIsDirty(false);
    }
  }, [attendanceData]);

  const handleStatusChange = (workerId: string, status: AttendanceStatus) => {
    setDraft((prev) => ({
      ...prev,
      [workerId]: { ...prev[workerId], status },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    const recordsToSave: AttendanceInsert[] = (attendanceData || [])
      .filter((item) => draft[item.worker.id]?.status != null)
      .map((item) => ({
        worker_id: item.worker.id,
        attendance_date: formattedDate,
        status: draft[item.worker.id].status as AttendanceStatus,
        remarks: draft[item.worker.id]?.remarks || null,
      }));

    if (recordsToSave.length === 0) {
      toast.add({ title: "No changes", description: "No attendance marks to save." });
      return;
    }

    try {
      await upsertMutation.mutateAsync({ records: recordsToSave, date: formattedDate });
      toast.add({
        title: "Attendance Saved",
        description: `Successfully saved attendance for ${formattedDate}.`,
      });
      setIsDirty(false);
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to save attendance.",
        type: "error",
      });
    }
  };

  // Compute stats for dashboard header
  const total = attendanceData?.length || 0;
  const presentCount = Object.values(draft).filter((r) => r.status === "present").length;
  const absentCount = Object.values(draft).filter((r) => r.status === "absent").length;
  const leaveCount = Object.values(draft).filter((r) => r.status === "leave").length;
  const halfDayCount = Object.values(draft).filter((r) => r.status === "half_day").length;

  // Render Status Selector (used in both Mobile and Desktop)
  const renderStatusSelector = (workerId: string, currentStatus: AttendanceStatus | null) => {
    const options: { label: string; value: AttendanceStatus; color: string }[] = [
      { label: "P", value: "present", color: "bg-emerald-500 hover:bg-emerald-600" },
      { label: "A", value: "absent", color: "bg-rose-500 hover:bg-rose-600" },
      { label: "L", value: "leave", color: "bg-amber-500 hover:bg-amber-600" },
      { label: "H", value: "half_day", color: "bg-blue-500 hover:bg-blue-600" },
    ];

    return (
      <div className="flex gap-1">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant={currentStatus === opt.value ? "default" : "outline"}
            size="sm"
            className={cn(
              "w-10 h-10 p-0 text-sm font-bold transition-colors",
              currentStatus === opt.value && `${opt.color} text-white border-transparent`
            )}
            onClick={() => handleStatusChange(workerId, opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    );
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "employee_id",
      header: "ID",
      cell: (item) => item.worker.employee_id,
      className: "font-medium text-muted-foreground",
    },
    {
      key: "name",
      header: "Worker",
      cell: (item) => (
        <div>
          <p className="font-semibold">{item.worker.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.worker.department?.name || "No Dept"} • {item.worker.area?.name || "No Area"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Mark Attendance",
      cell: (item) => renderStatusSelector(item.worker.id, draft[item.worker.id]?.status || null),
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Top Header & Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Selection */}
        <Card>
          <CardContent className="p-6 flex flex-col justify-center items-start gap-2 h-full">
            <h3 className="text-sm font-medium text-muted-foreground">Selected Date</h3>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full max-w-[280px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  />
                }
              >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) setSelectedDate(d);
                  }}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</span>
              <span className="text-xs uppercase font-semibold text-emerald-600/70 dark:text-emerald-400/70">Present</span>
            </CardContent>
          </Card>
          <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{absentCount}</span>
              <span className="text-xs uppercase font-semibold text-rose-600/70 dark:text-rose-400/70">Absent</span>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{leaveCount}</span>
              <span className="text-xs uppercase font-semibold text-amber-600/70 dark:text-amber-400/70">Leave</span>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{halfDayCount}</span>
              <span className="text-xs uppercase font-semibold text-blue-600/70 dark:text-blue-400/70">Half Day</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-background rounded-lg border shadow-sm relative overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <DataTable
            data={attendanceData || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No active workers found."
            className="border-0 shadow-none"
          />
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y">
          {isLoading && (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && (!attendanceData || attendanceData.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">No active workers found.</div>
          )}
          {attendanceData?.map((item) => (
            <div key={item.worker.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{item.worker.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.worker.employee_id} • {item.worker.department?.name || "No Dept"}
                  </p>
                </div>
              </div>
              <div className="w-full flex justify-center">
                {renderStatusSelector(item.worker.id, draft[item.worker.id]?.status || null)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save FAB for Mobile / Sticky footer for Desktop */}
      <div className={cn(
        "fixed md:sticky bottom-4 md:bottom-0 left-4 right-4 md:left-auto md:right-auto md:w-full",
        "bg-background/80 backdrop-blur-md border rounded-full md:rounded-none p-2 shadow-lg md:shadow-none md:border-0 md:bg-transparent md:border-t flex justify-end z-40 transition-all",
        isDirty ? "translate-y-0 opacity-100" : "md:translate-y-0 md:opacity-100 opacity-0 translate-y-full pointer-events-none md:pointer-events-auto"
      )}>
        <Button 
          size="lg" 
          onClick={handleSave} 
          disabled={!isDirty || upsertMutation.isPending}
          className="w-full md:w-auto shadow-md gap-2"
        >
          {upsertMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isDirty ? "Save Changes" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
