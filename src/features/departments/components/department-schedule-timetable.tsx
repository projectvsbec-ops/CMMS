"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useWorkerSchedules } from "@/features/schedule/queries";
import { useWorkers } from "@/features/workers/queries";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import type { WorkerScheduleWithRelations } from "@/types";

interface DepartmentScheduleTimetableProps {
  departmentId: string;
}

export function DepartmentScheduleTimetable({ departmentId }: DepartmentScheduleTimetableProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const { data: workers, isLoading: workersLoading } = useWorkers();
  const { data: schedules, isLoading: schedulesLoading } = useWorkerSchedules({ 
    departmentId,
    date: selectedDate 
  });

  // Filter workers for this department
  const deptWorkers = useMemo(() => {
    return workers?.filter(w => w.department_id === departmentId) || [];
  }, [workers, departmentId]);

  // Build the timetable data structure
  const timetable = useMemo(() => {
    if (!schedules || !deptWorkers) return { timeBlocks: [], rows: [] };

    // 1. Extract and sort unique time blocks
    const blockSet = new Set<string>();
    schedules.forEach(s => {
      // Assuming start_time and end_time are "HH:mm:ss"
      const start = s.start_time.substring(0, 5);
      const end = s.end_time.substring(0, 5);
      blockSet.add(`${start} - ${end}`);
    });

    const timeBlocks = Array.from(blockSet).sort((a, b) => {
      const timeA = a.split(" - ")[0];
      const timeB = b.split(" - ")[0];
      return timeA.localeCompare(timeB);
    });

    // 2. Map workers to their schedules
    const rows = deptWorkers.map(worker => {
      const workerSchedules = schedules.filter(s => s.worker_id === worker.id);
      
      const blocksData: Record<string, WorkerScheduleWithRelations[]> = {};
      
      workerSchedules.forEach(s => {
        const start = s.start_time.substring(0, 5);
        const end = s.end_time.substring(0, 5);
        const key = `${start} - ${end}`;
        
        if (!blocksData[key]) blocksData[key] = [];
        blocksData[key].push(s);
      });

      return {
        worker,
        blocksData
      };
    });

    return { timeBlocks, rows };
  }, [schedules, deptWorkers]);

  const changeDate = (days: number) => {
    const d = parseISO(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  if (workersLoading || schedulesLoading) {
    return <LoadingSkeleton variant="card" count={3} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Worker Schedule</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40 pl-10"
            />
            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {timetable.timeBlocks.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground bg-muted/20">
          No schedules found for this date.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto shadow-sm">
          <table className="w-full text-sm text-left border-collapse min-w-max border-border">
            <thead className="text-xs uppercase bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-3 border-r border-b border-border w-48 sticky left-0 bg-primary z-10 text-center shadow-[1px_0_0_var(--border)]">Name</th>
                <th className="px-4 py-3 border-r border-b border-border w-32 sticky left-48 bg-primary z-10 text-center shadow-[1px_0_0_var(--border)]">Area</th>
                {timetable.timeBlocks.map(block => (
                  <th key={block} className="px-4 py-3 border-r border-b border-border text-center align-middle whitespace-nowrap min-w-[150px]">
                    {block}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetable.rows.map((row, index) => (
                <tr key={row.worker.id} className="bg-card border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 border-r border-border sticky left-0 bg-card z-10 font-medium text-center shadow-[1px_0_0_var(--border)]">
                    <p>{row.worker.name}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">{row.worker.designation || "Worker"}</p>
                  </td>
                  <td className="px-4 py-3 border-r border-border sticky left-48 bg-card z-10 text-center font-medium shadow-[1px_0_0_var(--border)]">
                    {row.worker.area?.name || "-"}
                  </td>
                  {timetable.timeBlocks.map(block => {
                    const cellSchedules = row.blocksData[block];
                    return (
                      <td key={block} className="px-2 py-2 border-r border-border align-top">
                        {cellSchedules && cellSchedules.length > 0 ? (
                          <div className="space-y-2">
                            {cellSchedules.map(schedule => (
                              <div key={schedule.id} className="text-xs text-center p-1 rounded bg-muted/30">
                                <p className="font-semibold text-foreground leading-tight">
                                  {schedule.work_title}
                                </p>
                                {schedule.location && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {schedule.location}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="sr-only">No schedule</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
