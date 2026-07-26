"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/shared/data-table";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { exportToCSV } from "@/features/reports/export-utils";

export default function ActivityLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [limit, setLimit] = useState("100");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity_logs", entityType, limit],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(parseInt(limit));
      
      if (entityType !== "all") {
        query = query.eq("entity_type", entityType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs?.filter((log: any) => 
    (log.action?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (log.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "created_at", header: "Timestamp", cell: (r: any) => format(new Date(r.created_at), "MMM dd, yyyy HH:mm:ss") },
    { key: "entity_type", header: "Module", cell: (r: any) => <span className="uppercase text-xs font-semibold">{r.entity_type?.replace(/_/g, " ")}</span> },
    { key: "action", header: "Action", cell: (r: any) => <span className="font-medium text-foreground">{r.action}</span> },
    { key: "description", header: "Details", cell: (r: any) => <span>{r.description}</span> },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Activity Logs"
        description="A complete audit trail of all actions performed in the system."
      >
        <Button variant="outline" onClick={() => exportToCSV(filteredLogs || [], "Activity_Logs_Export")}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search action or details..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={entityType} onValueChange={(v) => v && setEntityType(v)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="workers">Workers</SelectItem>
            <SelectItem value="work_tasks">Work Tasks</SelectItem>
            <SelectItem value="inventory_items">Inventory</SelectItem>
            <SelectItem value="attendance">Attendance</SelectItem>
            <SelectItem value="worker_schedules">Schedules</SelectItem>
            <SelectItem value="app_settings">Settings</SelectItem>
          </SelectContent>
        </Select>
        <Select value={limit} onValueChange={(v) => v && setLimit(v)}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">Last 100</SelectItem>
            <SelectItem value="500">Last 500</SelectItem>
            <SelectItem value="1000">Last 1000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredLogs || []}
          isLoading={isLoading}
          emptyTitle="No logs found"
          emptyDescription="There are no activity logs matching your filters."
        />
      </div>
    </div>
  );
}
