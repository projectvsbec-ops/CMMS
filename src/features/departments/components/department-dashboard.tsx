"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyAttendanceView } from "@/features/attendance/components/daily-attendance-view";
import { DepartmentWorkAllocated } from "./department-work-allocated";
import { DepartmentScheduleTimetable } from "./department-schedule-timetable";
import { DepartmentInventoryList } from "./department-inventory-list";

interface DepartmentDashboardProps {
  departmentId: string;
}

export function DepartmentDashboard({ departmentId }: DepartmentDashboardProps) {
  return (
    <div className="mt-6">
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[600px] mb-6 bg-muted/50 p-1">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="work">Work Allocated</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm min-h-[500px]">
          <TabsContent value="attendance" className="m-0 mt-0">
            <DailyAttendanceView departmentId={departmentId} />
          </TabsContent>

          <TabsContent value="work" className="m-0 mt-0">
            <DepartmentWorkAllocated departmentId={departmentId} />
          </TabsContent>

          <TabsContent value="schedule" className="m-0 mt-0">
            <DepartmentScheduleTimetable departmentId={departmentId} />
          </TabsContent>

          <TabsContent value="inventory" className="m-0 mt-0">
            <DepartmentInventoryList departmentId={departmentId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
