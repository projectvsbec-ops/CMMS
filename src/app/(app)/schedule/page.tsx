"use client";

import { useState } from "react";
import { format, subDays, addDays } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Wrench, Clock, FileText, Upload } from "lucide-react";

import { TimelineView } from "@/features/schedule/components/timeline-view";
import { WorkerScheduleForm } from "@/features/schedule/components/worker-schedule-form";
import { PreventiveMaintenanceForm } from "@/features/schedule/components/preventive-maintenance-form";
import { ScheduleBulkImport } from "@/features/schedule/components/schedule-bulk-import";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";

import { 
  useWorkerSchedules, 
  usePreventiveMaintenance, 
  useScheduleTemplates,
  useLazyCheckPreventiveMaintenance
} from "@/features/schedule/queries";

import type { PreventiveMaintenanceWithRelations, ScheduleTemplate, WorkerScheduleWithRelations } from "@/types";

export default function SchedulePage() {
  // Fire our lazy evaluator for auto-generating PMs
  useLazyCheckPreventiveMaintenance();

  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");

  const [activeTab, setActiveTab] = useState("timeline");

  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<WorkerScheduleWithRelations | null>(null);

  const [isPmFormOpen, setIsPmFormOpen] = useState(false);
  const [pmToEdit, setPmToEdit] = useState<PreventiveMaintenanceWithRelations | null>(null);

  const { data: schedules, isLoading: isLoadingSchedules } = useWorkerSchedules({ date: dateStr });
  const { data: pms, isLoading: isLoadingPms } = usePreventiveMaintenance();
  const { data: templates, isLoading: isLoadingTemplates } = useScheduleTemplates();

  const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const openNewSchedule = () => {
    setScheduleToEdit(null);
    setIsScheduleFormOpen(true);
  };

  const openNewPm = () => {
    setPmToEdit(null);
    setIsPmFormOpen(true);
  };

  const pmColumns = [
    { key: "title", header: "Title", cell: (pm: PreventiveMaintenanceWithRelations) => <span className="font-semibold">{pm.title}</span> },
    { key: "department", header: "Department", cell: (pm: PreventiveMaintenanceWithRelations) => pm.department?.name || "-" },
    { key: "frequency", header: "Frequency", cell: (pm: PreventiveMaintenanceWithRelations) => <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">{pm.frequency}</Badge> },
    { key: "next_due_date", header: "Next Due", cell: (pm: PreventiveMaintenanceWithRelations) => {
        const isOverdue = new Date(pm.next_due_date) < new Date(new Date().setHours(0,0,0,0));
        return <span className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>{format(new Date(pm.next_due_date), "MMM dd, yyyy")}</span>
    }},
    { key: "is_active", header: "Status", cell: (pm: PreventiveMaintenanceWithRelations) => (
      <span className={pm.is_active ? "text-green-600 font-medium text-sm" : "text-muted-foreground text-sm"}>
        {pm.is_active ? "Active" : "Paused"}
      </span>
    )}
  ];

  const templateColumns = [
    { key: "name", header: "Template Name", cell: (t: ScheduleTemplate) => <span className="font-semibold">{t.name}</span> },
    { key: "description", header: "Description", cell: (t: ScheduleTemplate) => <span className="text-sm text-muted-foreground">{t.description || "-"}</span> },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Work Schedule"
        description="Manage daily assignments and recurring preventive maintenance."
      >
        {activeTab === "timeline" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button onClick={openNewSchedule} className="gap-2">
              <Plus className="h-4 w-4" /> New Schedule
            </Button>
          </div>
        )}
        {activeTab === "pm" && (
          <Button onClick={openNewPm} className="gap-2">
            <Plus className="h-4 w-4" /> New PM Plan
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="timeline" className="gap-2"><Clock className="h-4 w-4" /> Daily Timeline</TabsTrigger>
          <TabsTrigger value="pm" className="gap-2"><Wrench className="h-4 w-4" /> Preventive Maintenance</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><FileText className="h-4 w-4" /> Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="flex items-center justify-between bg-card border rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevDay}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={handleNextDay}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="ghost" onClick={handleToday} className="text-sm font-medium">Today</Button>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold min-w-[150px] text-center">
                {format(currentDate, "EEEE, MMM dd")}
              </h2>
            </div>
            
            <div className="w-[120px]">
              <Input 
                type="date" 
                value={dateStr} 
                onChange={(e) => {
                  if (e.target.value) setCurrentDate(new Date(e.target.value));
                }} 
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0 pt-0 sm:p-0">
              {isLoadingSchedules ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading timeline...</div>
              ) : (
                <TimelineView 
                  date={dateStr} 
                  schedules={schedules || []} 
                  onScheduleClick={(s) => {
                    setScheduleToEdit(s);
                    setIsScheduleFormOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pm">
          <DataTable
            columns={pmColumns}
            data={pms || []}
            isLoading={isLoadingPms}
            emptyTitle="No Preventive Maintenance Plans"
            emptyDescription="Create a PM plan to automatically generate work tasks on a recurring schedule."
            onRowClick={(pm) => {
              setPmToEdit(pm);
              setIsPmFormOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="templates">
          <DataTable
            columns={templateColumns}
            data={templates || []}
            isLoading={isLoadingTemplates}
            emptyTitle="No Templates Found"
            emptyDescription="Schedule templates allow you to quickly assign common tasks."
          />
        </TabsContent>
      </Tabs>

      <WorkerScheduleForm 
        open={isScheduleFormOpen} 
        onOpenChange={setIsScheduleFormOpen} 
        schedule={scheduleToEdit} 
        defaultDate={dateStr}
      />

      <ScheduleBulkImport
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
      />

      <PreventiveMaintenanceForm
        open={isPmFormOpen}
        onOpenChange={setIsPmFormOpen}
        pm={pmToEdit}
      />
    </div>
  );
}
