"use client";

import { useState } from "react";
import { format, isSameMonth, startOfMonth, endOfMonth, isToday } from "date-fns";
import { useWorkerAttendanceStats } from "@/features/attendance/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkerAttendanceTabProps {
  workerId: string;
}

export function WorkerAttendanceTab({ workerId }: WorkerAttendanceTabProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const { data: stats, isLoading } = useWorkerAttendanceStats(workerId, currentMonth);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Calculate stats
  let present = 0;
  let absent = 0;
  let leave = 0;
  let halfDay = 0;
  
  const recordMap = new Map<string, string>(); // 'YYYY-MM-DD' -> status

  if (stats) {
    stats.forEach(r => {
      recordMap.set(r.attendance_date, r.status);
      if (r.status === "present") present++;
      if (r.status === "absent") absent++;
      if (r.status === "leave") leave++;
      if (r.status === "half_day") halfDay++;
    });
  }

  const totalWorkingDays = present + absent + leave + halfDay;
  // Let's assume present = 1, half_day = 0.5 for percentage calculation
  const presentEquivalent = present + (halfDay * 0.5);
  const percentage = totalWorkingDays > 0 ? Math.round((presentEquivalent / totalWorkingDays) * 100) : 0;

  // Custom Day rendering for the calendar
  const modifiers = {
    present: (date: Date) => recordMap.get(format(date, "yyyy-MM-dd")) === "present",
    absent: (date: Date) => recordMap.get(format(date, "yyyy-MM-dd")) === "absent",
    leave: (date: Date) => recordMap.get(format(date, "yyyy-MM-dd")) === "leave",
    half_day: (date: Date) => recordMap.get(format(date, "yyyy-MM-dd")) === "half_day",
  };

  const modifiersStyles = {
    present: { backgroundColor: "var(--color-emerald-500)", color: "white", fontWeight: "bold" },
    absent: { backgroundColor: "var(--color-rose-500)", color: "white", fontWeight: "bold" },
    leave: { backgroundColor: "var(--color-amber-500)", color: "white", fontWeight: "bold" },
    half_day: { backgroundColor: "var(--color-blue-500)", color: "white", fontWeight: "bold" },
  };

  // Fallback classes in case inline var styles don't apply well via react-day-picker
  const modifiersClassNames = {
    present: "bg-emerald-500 text-white hover:bg-emerald-600 focus:bg-emerald-500 focus:text-white font-bold",
    absent: "bg-rose-500 text-white hover:bg-rose-600 focus:bg-rose-500 focus:text-white font-bold",
    leave: "bg-amber-500 text-white hover:bg-amber-600 focus:bg-amber-500 focus:text-white font-bold",
    half_day: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-500 focus:text-white font-bold",
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation & Overview */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold w-32 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendar View</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0 pb-6">
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Calendar
                mode="single"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                disableNavigation
                showOutsideDays={false}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="pointer-events-none" // View only calendar
              />
            )}
          </CardContent>
        </Card>

        {/* Stats & Legend */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{present}</span>
                <span className="text-xs uppercase font-semibold text-emerald-600/70 dark:text-emerald-400/70 mt-1">Present</span>
              </CardContent>
            </Card>
            <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{absent}</span>
                <span className="text-xs uppercase font-semibold text-rose-600/70 dark:text-rose-400/70 mt-1">Absent</span>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{leave}</span>
                <span className="text-xs uppercase font-semibold text-amber-600/70 dark:text-amber-400/70 mt-1">Leave</span>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{halfDay}</span>
                <span className="text-xs uppercase font-semibold text-blue-600/70 dark:text-blue-400/70 mt-1">Half Day</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center relative">
                  {/* Fake circle progress indicator */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                    />
                  </svg>
                  <span className="text-2xl font-bold">{percentage}%</span>
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">
                    This score is calculated based on the number of days present vs total working days recorded in this month.
                    Half days count as 50% presence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
