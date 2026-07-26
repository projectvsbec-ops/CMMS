"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWorker } from "@/features/workers/queries";
import { WorkerAttendanceTab } from "@/features/workers/components/worker-attendance-tab";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { WORKER_STATUSES } from "@/lib/constants";
import { Phone, Calendar, Building2, Map as MapIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: worker, isLoading, error } = useWorker(id);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "tasks" | "schedule">("overview");

  if (isLoading) return <LoadingSkeleton variant="card" count={3} />;
  if (error || !worker) return <div>Worker not found.</div>;

  const statusLabel = WORKER_STATUSES.find((s) => s.value === worker.status)?.label || worker.status;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "attendance", label: "Attendance" },
    { id: "tasks", label: "Tasks" },
    { id: "schedule", label: "Schedule" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={worker.name}
        description={`Employee ID: ${worker.employee_id}`}
        backLink="/workers"
      />

      <div className="flex gap-2">
        <StatusBadge
          type="worker"
          value={worker.status}
        />
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Profile Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium text-sm">{worker.department?.name || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <MapIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Area</p>
                    <p className="font-medium text-sm">{worker.area?.name || "None"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="font-medium text-sm">{worker.phone || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joining Date</p>
                    <p className="font-medium text-sm">
                      {new Date(worker.joining_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold text-lg mb-4">Notes</h3>
              {worker.notes ? (
                <p className="text-sm whitespace-pre-wrap">{worker.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No notes available.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <WorkerAttendanceTab workerId={worker.id} />
        )}

        {activeTab !== "overview" && activeTab !== "attendance" && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              This module will be implemented in a future phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
