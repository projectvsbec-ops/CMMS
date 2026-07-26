"use client";

import { useMemo } from "react";
import { format, parse } from "date-fns";
import type { WorkerScheduleWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";

interface TimelineViewProps {
  date: string; // YYYY-MM-DD
  schedules: WorkerScheduleWithRelations[];
  onScheduleClick?: (schedule: WorkerScheduleWithRelations) => void;
}

export function TimelineView({ date, schedules, onScheduleClick }: TimelineViewProps) {
  // Configurable hours 07:00 to 18:00
  const START_HOUR = 7;
  const END_HOUR = 18;
  const TOTAL_HOURS = END_HOUR - START_HOUR;

  const hours = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => START_HOUR + i);
  }, [TOTAL_HOURS]);

  // Group schedules by worker
  const groupedSchedules = useMemo(() => {
    const groups: Record<string, { workerName: string; workerId: string; blocks: WorkerScheduleWithRelations[] }> = {};
    
    schedules.forEach(schedule => {
      if (!schedule.worker) return;
      if (!groups[schedule.worker_id]) {
        groups[schedule.worker_id] = {
          workerId: schedule.worker_id,
          workerName: schedule.worker.name,
          blocks: []
        };
      }
      groups[schedule.worker_id].blocks.push(schedule);
    });

    return Object.values(groups).sort((a, b) => a.workerName.localeCompare(b.workerName));
  }, [schedules]);

  // Helper to calculate position in percentage for a given HH:mm time
  const getPositionPercentage = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const totalMinutesFromStart = (h - START_HOUR) * 60 + m;
    const totalTimelineMinutes = TOTAL_HOURS * 60;
    
    if (totalMinutesFromStart < 0) return 0; // Starts before timeline
    if (totalMinutesFromStart > totalTimelineMinutes) return 100;
    
    return (totalMinutesFromStart / totalTimelineMinutes) * 100;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Started": return "bg-blue-500 text-white hover:bg-blue-600";
      case "Completed": return "bg-green-500 text-white hover:bg-green-600";
      case "Cancelled": return "bg-slate-500 text-white hover:bg-slate-600";
      default: return "bg-primary text-primary-foreground hover:bg-primary/90"; // Scheduled
    }
  };

  if (groupedSchedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border rounded-md bg-muted/20 text-muted-foreground">
        <p>No schedules found for {format(parse(date, "yyyy-MM-dd", new Date()), "PP")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-background overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header (Hours) */}
        <div className="flex border-b bg-muted/40 sticky top-0 z-10">
          <div className="w-48 shrink-0 p-3 font-semibold text-sm border-r flex items-center">
            Worker
          </div>
          <div className="flex-1 relative h-12">
            {hours.map((hour, i) => (
              <div 
                key={hour}
                className="absolute top-0 bottom-0 border-l border-border/50 px-1 pt-2 text-xs text-muted-foreground font-medium"
                style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {/* Rows (Workers) */}
        <div className="divide-y">
          {groupedSchedules.map((group) => (
            <div key={group.workerId} className="flex group hover:bg-muted/10 transition-colors">
              <div className="w-48 shrink-0 p-3 border-r flex flex-col justify-center">
                <span className="font-medium text-sm truncate">{group.workerName}</span>
              </div>
              
              <div className="flex-1 relative min-h-[60px] py-2">
                {/* Background grid lines */}
                {hours.map((hour, i) => (
                  <div 
                    key={`grid-${hour}`}
                    className="absolute top-0 bottom-0 border-l border-border/30 w-px"
                    style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
                  />
                ))}

                {/* Blocks */}
                {group.blocks.map((block) => {
                  const left = Math.max(0, getPositionPercentage(block.start_time));
                  const right = Math.min(100, getPositionPercentage(block.end_time));
                  const width = right - left;
                  
                  // Don't render blocks outside our 7-18 window
                  if (left >= 100 || right <= 0) return null;

                  return (
                    <div
                      key={block.id}
                      onClick={() => onScheduleClick?.(block)}
                      className={`absolute top-2 bottom-2 rounded shadow-sm overflow-hidden flex flex-col px-2 py-1 cursor-pointer transition-all ${getStatusStyle(block.schedule_status)}`}
                      style={{ 
                        left: `${left}%`, 
                        width: `${width}%`,
                        zIndex: 5
                      }}
                      title={`${block.work_title} (${block.start_time.substring(0,5)} - ${block.end_time.substring(0,5)})`}
                    >
                      <div className="text-xs font-semibold truncate leading-tight">
                        {block.work_title}
                      </div>
                      {width > 10 && ( // Only show time if block is wide enough
                        <div className="text-[10px] opacity-90 truncate leading-tight mt-0.5">
                          {block.start_time.substring(0,5)} - {block.end_time.substring(0,5)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
