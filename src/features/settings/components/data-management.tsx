"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, AlertTriangle, FileJson, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";
import { exportToCSV, exportToExcel } from "@/features/reports/export-utils";

const EXPORTABLE_TABLES = [
  "workers",
  "departments",
  "areas",
  "inventory_items",
  "work_tasks",
  "attendance",
  "worker_schedules"
];

export function DataManagement() {
  const [exportTable, setExportTable] = useState("workers");
  const [importTable, setImportTable] = useState("workers");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const supabase = createClient();

  const handleExport = async (format: "csv" | "excel" | "json") => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.from(exportTable).select("*");
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.add({ title: "No Data", description: `Table ${exportTable} is empty.` });
        return;
      }

      if (format === "csv") {
        exportToCSV(data, `${exportTable}_backup`);
      } else if (format === "excel") {
        exportToExcel(data, `${exportTable}_backup`);
      } else if (format === "json") {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${exportTable}_backup.json`;
        link.click();
      }
      
      toast.add({ title: "Export Successful", description: `Backed up ${data.length} records.` });
    } catch (error: any) {
      toast.add({ title: "Export Failed", description: error.message, type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        toast.add({ title: "Empty File", description: "The uploaded file contains no data rows.", type: "error" });
        return;
      }

      // Very basic import insertion. For production, you'd map columns explicitly.
      const { error } = await supabase.from(importTable).insert(jsonData as any[]);
      if (error) throw error;

      toast.add({ title: "Import Successful", description: `Imported ${jsonData.length} records into ${importTable}.` });
    } catch (error: any) {
      toast.add({ title: "Import Failed", description: error.message || "Failed to parse or insert data.", type: "error" });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Export & Backup
          </CardTitle>
          <CardDescription>Download snapshots of your database tables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Table</Label>
            <Select value={exportTable} onValueChange={(v) => v && setExportTable(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPORTABLE_TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => handleExport("csv")} disabled={isExporting}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("excel")} disabled={isExporting} className="text-green-600">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport("json")} disabled={isExporting} className="text-blue-600">
              <FileJson className="mr-2 h-4 w-4" /> JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Import Data
          </CardTitle>
          <CardDescription>Upload CSV or Excel files to bulk insert records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-md flex gap-3 text-sm text-amber-600">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <strong>Warning:</strong> Column names in your spreadsheet MUST exactly match the database schema. UUIDs must be valid.
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Table</Label>
            <Select value={importTable} onValueChange={(v) => v && setImportTable(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPORTABLE_TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Upload File (.xlsx, .csv)</Label>
            <Input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
