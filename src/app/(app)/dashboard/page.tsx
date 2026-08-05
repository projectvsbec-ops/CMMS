"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiGrid } from "@/features/dashboard/components/kpi-grid";
import { OperationalCharts } from "@/features/dashboard/components/operational-charts";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { useAuth } from "@/features/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = "Welcome back";

  return (
    <div className="space-y-4 lg:space-y-6 pb-4 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <PageHeader
          title={`${greeting}, Admin`}
          description="Here's a summary of campus maintenance operations today."
        />
      </div>

      <Suspense fallback={<div className="h-[120px] bg-muted/50 rounded-xl animate-pulse" />}>
        <KpiGrid />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <Suspense fallback={<div className="h-[400px] bg-muted/50 rounded-xl animate-pulse" />}>
            <OperationalCharts />
          </Suspense>
        </div>
        
        <div className="lg:col-span-1 space-y-4 lg:space-y-6 flex flex-col">
          <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
            <QuickActions />
          </Suspense>
          <div className="flex-1 min-h-[400px]">
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
              <ActivityFeed />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
