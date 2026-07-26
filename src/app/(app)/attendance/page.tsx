import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyAttendanceView } from "@/features/attendance/components/daily-attendance-view";
import { AttendanceHistoryView } from "@/features/attendance/components/attendance-history-view";

export const metadata: Metadata = {
  title: "Attendance | CMMS",
  description: "Manage worker attendance",
};

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        description="Mark daily attendance and review history."
      />

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="m-0 border-none p-0 outline-none">
          <DailyAttendanceView />
        </TabsContent>
        
        <TabsContent value="history" className="m-0 border-none p-0 outline-none">
          <AttendanceHistoryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
