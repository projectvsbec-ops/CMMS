"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDepartments } from "@/features/departments/queries";
import { useWorkers } from "@/features/workers/queries";
import type { ReportFilter } from "@/types";

interface ReportBuilderProps {
  onGenerate: (category: string, filters: ReportFilter, reportName: string) => void;
  isLoading: boolean;
}

const CATEGORIES = ["Work", "Inventory", "Attendance", "Schedule", "Worker"];
const DATE_PRESETS = [
  { label: "Today", get: () => [new Date(), new Date()] },
  { label: "Last 7 Days", get: () => [subDays(new Date(), 7), new Date()] },
  { label: "Last 30 Days", get: () => [subDays(new Date(), 30), new Date()] },
  { label: "This Month", get: () => [startOfMonth(new Date()), endOfMonth(new Date())] },
];

export function ReportBuilder({ onGenerate, isLoading }: ReportBuilderProps) {
  const [category, setCategory] = useState("Work");
  const [reportName, setReportName] = useState("Custom Work Report");
  
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const [departmentId, setDepartmentId] = useState("all");
  const [workerId, setWorkerId] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: departments } = useDepartments();
  const { data: workers } = useWorkers();

  const handleGenerate = () => {
    const filters: ReportFilter = {
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (departmentId !== "all") filters.department_id = departmentId;
    if (workerId !== "all") filters.worker_id = workerId;
    if (status !== "all") filters.status = status;

    onGenerate(category, filters, reportName);
  };

  const applyPreset = (preset: typeof DATE_PRESETS[0]) => {
    const [from, to] = preset.get();
    setDateFrom(format(from, "yyyy-MM-dd"));
    setDateTo(format(to, "yyyy-MM-dd"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Builder</CardTitle>
        <CardDescription>Configure your report parameters below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Report Category</Label>
            <Select value={category} onValueChange={(v) => { if (v) { setCategory(v); setReportName(`Custom ${v} Report`); }}}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Report Title</Label>
            <Input value={reportName} onChange={(e) => setReportName(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              {DATE_PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)} className="text-[10px] uppercase font-bold text-primary hover:underline">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={(v) => { if (v) setDepartmentId(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {category !== "Inventory" && (
            <div className="space-y-2">
              <Label>Worker</Label>
              <Select value={workerId} onValueChange={(v) => { if (v) setWorkerId(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workers</SelectItem>
                  {workers?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {category === "Work" && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={handleGenerate} disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? "Generating..." : "Generate Report"}
        </Button>
      </CardContent>
    </Card>
  );
}
