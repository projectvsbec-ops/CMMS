"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Clock, TrendingDown, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSavedReports, useBusinessIntelligence, useDeleteSavedReport } from "@/features/reports/queries";
import { DataTable } from "@/components/shared/data-table";
import type { SavedReport } from "@/types";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ReportsPage() {
  const router = useRouter();
  const { data: reports, isLoading: isReportsLoading } = useSavedReports();
  const { data: bi, isLoading: isBiLoading } = useBusinessIntelligence();
  const deleteMutation = useDeleteSavedReport();

  const columns = [
    { key: "name", header: "Report Name", cell: (r: SavedReport) => <span className="font-medium">{r.name}</span> },
    { key: "category", header: "Category", cell: (r: SavedReport) => <span className="text-muted-foreground">{r.category}</span> },
    { key: "created_at", header: "Created On", cell: (r: SavedReport) => format(new Date(r.created_at), "MMM dd, yyyy") },
    { 
      key: "actions", 
      header: "", 
      cell: (r: SavedReport) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/reports/builder?load=${r.id}`)}>
            Run
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(r.id)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reports & Analytics"
        description="Business intelligence, operational analytics, and saved exports."
      >
        <Button onClick={() => router.push("/reports/builder")} className="gap-2">
          <Plus className="h-4 w-4" /> New Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isBiLoading ? (
          <>
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
          </>
        ) : bi && (
          <>
            <StatCard
              title="Average Completion Time"
              value={`${bi.avgCompletionMins} mins`}
              icon={Clock}
              description="Across all completed tasks"
            />
            <StatCard
              title="Monthly Workload"
              value={bi.tasksThisMonth}
              icon={BarChart3}
              description="Tasks generated this month"
            />
            <StatCard
              title="Best Performing Dept"
              value={bi.deptAverages.length > 0 ? [...bi.deptAverages].sort((a,b) => a.avgMins - b.avgMins)[0].name : "N/A"}
              icon={TrendingDown}
              description="Lowest average resolution time"
            />
          </>
        )}
      </div>

      <div className="pt-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          Saved Reports
        </h2>
        <DataTable
          columns={columns}
          data={reports || []}
          isLoading={isReportsLoading}
          emptyTitle="No Saved Reports"
          emptyDescription="You haven't saved any report configurations yet."
        />
      </div>
    </div>
  );
}
