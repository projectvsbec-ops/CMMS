"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import * as XLSX from "xlsx";
import { useBulkCreateWorkTasks, useTaskCategories } from "../queries";
import { useDepartments } from "@/features/departments/queries";
import { useAreas } from "@/features/areas/queries";
import { useManagers } from "@/features/managers/queries";
import type { WorkTaskInsert } from "@/types";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const { data: departments } = useDepartments();
  const { data: areas } = useAreas();
  const { data: categories } = useTaskCategories();
  const { data: managers } = useManagers();
  const bulkCreate = useBulkCreateWorkTasks();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPreviewCount(null);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      toast.add({ title: "No file selected", description: "Please select an Excel or CSV file.", type: "error" });
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) {
            throw new Error("The uploaded file is empty.");
          }

          const newTasks: WorkTaskInsert[] = [];
          let skippedCount = 0;

          for (const row of jsonData as any[]) {
            // Find IDs by matching names (case-insensitive)
            const deptName = row["Department"]?.toString().trim().toLowerCase();
            const dept = departments?.find((d) => d.name.toLowerCase() === deptName);

            if (!dept) {
              skippedCount++;
              continue;
            }

            const areaName = row["Area"]?.toString().trim().toLowerCase();
            const area = areas?.find((a) => a.name.toLowerCase() === areaName);

            const catName = row["Category"]?.toString().trim().toLowerCase();
            const cat = categories?.find((c) => c.name.toLowerCase() === catName);

            const mgrName = row["Assign Manager"]?.toString().trim().toLowerCase();
            const mgr = managers?.find((m) => m.name.toLowerCase() === mgrName);

            // Parse Priority (fallback to 'medium')
            let priority = "medium";
            const p = row["Priority"]?.toString().trim().toLowerCase();
            if (["low", "medium", "high", "critical"].includes(p)) {
              priority = p;
            }

            // Parse Dates
            let createdAt = row["Created Date"] ? new Date(row["Created Date"]).toISOString() : new Date().toISOString();
            let targetDate = row["Target Date"] ? new Date(row["Target Date"]).toISOString() : null;

            const task: WorkTaskInsert = {
              title: row["Nature of Work (Title)"]?.toString() || "Untitled Task",
              description: row["Description"]?.toString() || null,
              department_id: dept.id,
              area_id: area?.id || null,
              category_id: cat?.id || null,
              manager_id: mgr?.id || null,
              worker_id: null,
              priority: priority as any,
              status: "pending", 
              target_date: targetDate,
              identified_by: row["Identified By"]?.toString() || null,
              remarks: row["Admin Remarks"]?.toString() || null,
              completed_date: null,
              estimated_duration: null,
            };

            newTasks.push(task);
          }

          await bulkCreate.mutateAsync(newTasks);
          
          setPreviewCount(newTasks.length);
          if (skippedCount > 0) {
            toast.add({ title: "Partial Success", description: `Created ${newTasks.length} tasks. Skipped ${skippedCount} tasks due to missing/invalid department.`, type: "warning" });
          } else {
            toast.add({ title: "Success", description: `Successfully created ${newTasks.length} work tasks.` });
          }
          setTimeout(() => {
            handleClose();
          }, 2000);
          
        } catch (error: any) {
          console.error(error);
          toast.add({ title: "Parsing Error", description: error.message || "Failed to parse the Excel file.", type: "error" });
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.add({ title: "Upload Error", description: "Failed to read the file.", type: "error" });
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewCount(null);
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Work Tasks</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file to import multiple tasks at once. 
            The file should contain columns exactly matching the export format.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/20">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Expected Columns:<br/>
              <span className="font-mono text-xs">Nature of Work (Title), Description, Department, Area, Category, Priority, Assign Manager, Created Date, Target Date, Identified By, Admin Remarks</span>
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full max-w-[200px]">
              Choose File
            </Button>
            {file && <p className="text-sm font-medium mt-3 text-primary">{file.name}</p>}
          </div>

          <div className="bg-blue-50/50 p-3 rounded-md flex items-start gap-3 border border-blue-100">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Mapping Rules:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>Departments, Areas, Categories, and Managers must exactly match existing names in the system.</li>
                <li>Unmatched text fields will be left blank (unassigned).</li>
              </ul>
            </div>
          </div>
          
          {previewCount !== null && (
            <div className="bg-green-50/50 p-3 rounded-md flex items-center gap-3 border border-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-800 font-medium">Successfully processed {previewCount} tasks.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleProcess} disabled={!file || isProcessing || previewCount !== null} className="gap-2">
            {isProcessing ? "Processing..." : (
              <>
                <Upload className="h-4 w-4" /> Upload & Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
