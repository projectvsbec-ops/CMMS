"use client";

import { Users, UserCheck, AlertOctagon, CheckCircle2, PackageSearch, CalendarClock, Briefcase } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { useDashboardKPIs } from "../queries";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export function KpiGrid() {
  const { data: kpis, isLoading } = useDashboardKPIs();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Workers"
        value={kpis.totalWorkers}
        icon={Users}
        description="Active campus workers"
        onClick={() => router.push("/workers")}
      />
      <StatCard
        title="Present Today"
        value={kpis.presentToday}
        icon={UserCheck}
        description={`${kpis.absentToday} Absent`}
        onClick={() => router.push("/attendance")}
        className="border-green-500/20 bg-green-500/5"
      />
      <StatCard
        title="Active Tasks"
        value={kpis.activeTasks}
        icon={Briefcase}
        description="Pending, Assigned, In Progress"
        onClick={() => router.push("/work")}
        className="border-blue-500/20 bg-blue-500/5"
      />
      <StatCard
        title="Completed Today"
        value={kpis.completedToday}
        icon={CheckCircle2}
        description="Tasks successfully closed"
        className="border-emerald-500/20 bg-emerald-500/5"
      />
      <StatCard
        title="Overdue Tasks"
        value={kpis.overdueTasks}
        icon={AlertOctagon}
        description="Passed target date"
        className="border-destructive/20 bg-destructive/5"
      />
      <StatCard
        title="Low Stock Items"
        value={kpis.lowStockItems}
        icon={PackageSearch}
        description="Items at or below reorder level"
        onClick={() => router.push("/inventory")}
        className={kpis.lowStockItems > 0 ? "border-amber-500/30 bg-amber-500/10" : ""}
      />
      <StatCard
        title="Scheduled Jobs"
        value={kpis.scheduledJobsToday}
        icon={CalendarClock}
        description="Time blocks scheduled today"
        onClick={() => router.push("/schedule")}
      />
    </div>
  );
}
