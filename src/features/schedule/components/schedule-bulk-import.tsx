"use client";

import { useState, useRef, useMemo } from "react";
import * as xlsx from "xlsx";
import { format, parse } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Upload, FileUp, X, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWorkers, useBulkCreateWorkers, useUpdateWorker } from "@/features/workers/queries";
import { useDepartments } from "@/features/departments/queries";
import { useAreas, useCreateArea } from "@/features/areas/queries";
import { useBulkCreateWorkerSchedules } from "@/features/schedule/queries";
import type { WorkerScheduleInsert, WorkerInsert } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ScheduleBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  index: number;
  workerName: string;
  employeeId: string;
  designation: string;
  workerId: string | null; // Database UUID (null if new)
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  location: string;
  workTitle: string;
  isNewWorker: boolean;
  isValid: boolean;
  error?: string;
}

export function ScheduleBulkImport({ open, onOpenChange }: ScheduleBulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: workers } = useWorkers();
  const { data: departments } = useDepartments();
  const { data: areas } = useAreas();
  const bulkCreateMutation = useBulkCreateWorkerSchedules();
  const bulkCreateWorkersMutation = useBulkCreateWorkers();
  const updateWorkerMutation = useUpdateWorker();
  const createAreaMutation = useCreateArea();

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setSelectedDepartmentId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "00:00:00";
    // Clean string: replace . with : and remove AM/PM
    let cleaned = timeStr.toString().replace(/\./g, ":").trim();
    
    // Attempt basic parsing for AM/PM formats
    const isPM = cleaned.toLowerCase().includes("pm");
    const isAM = cleaned.toLowerCase().includes("am");
    cleaned = cleaned.replace(/am|pm/i, "").trim();
    
    const parts = cleaned.split(":");
    let h = parseInt(parts[0] || "0", 10);
    let m = parts[1] ? parts[1].padStart(2, "0") : "00";
    let s = parts[2] ? parts[2].padStart(2, "0") : "00";
    
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    
    return `${h.toString().padStart(2, "0")}:${m}:${s}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return format(new Date(), "yyyy-MM-dd");
    try {
      if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) {
         const parsed = parse(dateStr, "dd-MM-yyyy", new Date());
         if (!isNaN(parsed.getTime())) return format(parsed, "yyyy-MM-dd");
      }
      return format(new Date(dateStr), "yyyy-MM-dd");
    } catch {
      return format(new Date(), "yyyy-MM-dd");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet);

      const workerList = workers || [];
      const parsed: ParsedRow[] = rawData.map((row, index) => {
        const employeeId = (row["worker_id"] || row["Worker ID"] || row["Employee ID"] || "").toString().trim();
        const workerName = (row["Name"] || row["Worker Name"] || row["worker_name"] || "").toString().trim();
        const designation = (row["Designation"] || row["designation"] || "").toString().trim();
        const location = (row["Area"] || row["Location"] || row["location"] || "").toString().trim();
        const rawDate = row["Date"] || row["schedule_date"] || format(new Date(), "dd-MM-yyyy");
        const rawStart = row["Start Time"] || row["start_time"] || "";
        const rawEnd = row["End Time"] || row["end_time"] || "";
        const workTitle = row["Work Title"] || row["work_title"] || "";

        let matchedWorkerId = null;
        let isNewWorker = false;
        let error = "";
        
        if (!employeeId) {
          error = "Worker/Employee ID missing";
        } else {
          // Attempt to match by employee_id strictly
          const matched = workerList.find(w => w.employee_id.toString().trim() === employeeId);
          if (matched) {
            matchedWorkerId = matched.id;
          } else {
            isNewWorker = true;
          }
        }

        if (isNewWorker && !workerName) {
          error = error ? `${error}, Name required for new worker` : "Name required for new worker";
        }

        if (!workTitle) {
          error = error ? `${error}, Work Title missing` : "Work Title is missing";
        }

        return {
          index,
          employeeId,
          workerName,
          designation,
          workerId: matchedWorkerId,
          date: formatDate(rawDate),
          startTime: formatTime(rawStart),
          endTime: formatTime(rawEnd),
          location,
          workTitle,
          isNewWorker,
          isValid: (matchedWorkerId !== null || isNewWorker) && workTitle !== "" && employeeId !== "",
          error
        };
      });

      setParsedData(parsed);
    } catch (err) {
      console.error("Error parsing Excel/CSV file", err);
    } finally {
      setIsParsing(false);
    }
  };

  const newWorkersCount = useMemo(() => {
    const uniqueNewIds = new Set(parsedData.filter(r => r.isNewWorker && r.isValid).map(r => r.employeeId));
    return uniqueNewIds.size;
  }, [parsedData]);

  const handleImport = async () => {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) return;

    let finalRows = [...validRows];
    
    // Helper to normalize strings for robust comparison
    const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 0. Auto-create missing areas
    const localAreas = [...(areas || [])];
    const areasToCreate = new Map<string, { location: string, department_id: string }>();

    for (const row of finalRows) {
      if (!row.location) continue;
      const deptId = row.isNewWorker 
         ? selectedDepartmentId 
         : workers?.find(w => w.id === row.workerId)?.department_id;
         
      if (!deptId) continue;

      const exists = localAreas.find(
         a => normalizeString(a.name) === normalizeString(row.location) && a.department_id === deptId
      );

      if (!exists) {
         const key = `${normalizeString(row.location)}_${deptId}`;
         if (!areasToCreate.has(key)) {
            areasToCreate.set(key, { location: row.location, department_id: deptId });
         }
      }
    }

    for (const area of areasToCreate.values()) {
       try {
          const newArea = await createAreaMutation.mutateAsync({
             name: area.location,
             department_id: area.department_id,
             description: "Auto-created during bulk import",
             is_active: true
          });
          // @ts-ignore - we only need id, name, department_id for matching
          localAreas.push(newArea);
       } catch (err) {
          console.error("Failed to create missing area", err);
       }
    }

    // 1. Bulk Create New Workers if any
    if (newWorkersCount > 0) {
      if (!selectedDepartmentId) return; // Prevent if no department selected

      // Extract unique new workers
      const newWorkersMap = new Map<string, WorkerInsert>();
      for (const row of validRows) {
        if (row.isNewWorker && !newWorkersMap.has(row.employeeId)) {
          // Attempt to map area by robust location string
          const matchedArea = localAreas.find(
            (a) => normalizeString(a.name) === normalizeString(row.location) && a.department_id === selectedDepartmentId
          );
          
          newWorkersMap.set(row.employeeId, {
            name: row.workerName,
            employee_id: row.employeeId,
            department_id: selectedDepartmentId,
            area_id: matchedArea ? matchedArea.id : null,
            phone: null,
            status: "active",
            joining_date: format(new Date(), "yyyy-MM-dd"),
            notes: row.designation ? `Designation: ${row.designation}` : null,
          });
        }
      }

      const workersToInsert = Array.from(newWorkersMap.values());
      try {
        const createdWorkers = await bulkCreateWorkersMutation.mutateAsync(workersToInsert);
        
        // Update finalRows with newly generated UUIDs
        finalRows = finalRows.map(row => {
          if (row.isNewWorker) {
            const created = createdWorkers.find(cw => cw.employee_id === row.employeeId);
            return { ...row, workerId: created?.id || null };
          }
          return row;
        });

      } catch (err) {
        console.error("Failed to create new workers", err);
        return; // Abort if worker creation fails
      }
    }

    // 1.5. Update Areas for Existing Workers
    const updateWorkerPromises = [];
    const updatedWorkerIds = new Set<string>();
    
    for (const row of finalRows) {
      if (!row.isNewWorker && row.workerId && !updatedWorkerIds.has(row.workerId) && row.location) {
        const workerInDb = workers?.find(w => w.id === row.workerId);
        if (workerInDb) {
          const matchedArea = localAreas.find(
            (a) => normalizeString(a.name) === normalizeString(row.location) && a.department_id === workerInDb.department_id
          );
          
          if (matchedArea && workerInDb.area_id !== matchedArea.id) {
             updatedWorkerIds.add(row.workerId);
             updateWorkerPromises.push(
               updateWorkerMutation.mutateAsync({ id: workerInDb.id, area_id: matchedArea.id })
             );
          }
        }
      }
    }

    if (updateWorkerPromises.length > 0) {
       try {
         await Promise.all(updateWorkerPromises);
       } catch (err) {
         console.error("Failed to update areas for existing workers", err);
       }
    }

    // 2. Bulk Create Schedules
    const inserts: WorkerScheduleInsert[] = finalRows
      .filter(row => row.workerId !== null)
      .map(row => ({
        worker_id: row.workerId!,
        template_id: null,
        schedule_date: row.date,
        start_time: row.startTime,
        end_time: row.endTime,
        location: row.location,
        work_title: row.workTitle,
        work_description: null,
        work_task_id: null,
        schedule_status: "Scheduled",
        remarks: "Bulk Imported",
      }));

    try {
      await bulkCreateMutation.mutateAsync(inserts);
      handleOpenChange(false);
    } catch (err) {
      console.error("Bulk import failed", err);
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.length - validCount;
  
  const isImporting = bulkCreateMutation.isPending || bulkCreateWorkersMutation.isPending;
  const isImportDisabled = validCount === 0 || isImporting || (newWorkersCount > 0 && !selectedDepartmentId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Bulk Import Schedules
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file containing worker schedules. Workers will be matched by their unique ID.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {!file && (
            <div 
              className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Click to upload file</h3>
              <p className="text-sm text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
              <Input 
                ref={fileInputRef}
                type="file" 
                accept=".csv, .xlsx, .xls"
                className="hidden" 
                onChange={handleFileUpload}
              />
            </div>
          )}

          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <X className="h-4 w-4 mr-2" /> Clear
                </Button>
              </div>

              {invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Action Required</AlertTitle>
                  <AlertDescription>
                    {invalidCount} {invalidCount === 1 ? "row has" : "rows have"} issues. These rows will be skipped.
                  </AlertDescription>
                </Alert>
              )}

              {newWorkersCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4 dark:bg-blue-950/20 dark:border-blue-900">
                  <div className="flex items-start gap-3">
                    <UserPlus className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                        {newWorkersCount} New {newWorkersCount === 1 ? 'Worker' : 'Workers'} Detected
                      </h4>
                      <p className="text-sm text-blue-800 mt-1 dark:text-blue-400">
                        These workers were not found in the database by their unique ID. They will be created automatically. Please select a Department to assign them to.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <Label className="whitespace-nowrap text-blue-900 dark:text-blue-300 font-semibold">
                      Assign to Department:
                    </Label>
                    <Select value={selectedDepartmentId} onValueChange={(val) => setSelectedDepartmentId(val || "")}>
                      <SelectTrigger className="w-[280px] bg-background">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {validCount > 0 && invalidCount === 0 && newWorkersCount === 0 && (
                <Alert className="border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                  <AlertTitle>Ready to Import</AlertTitle>
                  <AlertDescription>
                    All {validCount} rows are perfectly matched and ready to import.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Work Title</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.index} className={!row.isValid ? "bg-red-50 dark:bg-red-950/10" : row.isNewWorker ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}>
                        <TableCell className="font-medium text-muted-foreground">{row.index + 1}</TableCell>
                        <TableCell>
                          {!row.isValid ? (
                            <Badge variant="destructive" title={row.error}>{row.error}</Badge>
                          ) : row.isNewWorker ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">New Worker</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Matched</Badge>
                          )}
                        </TableCell>
                        <TableCell className={!row.isValid && row.error?.includes("Worker") ? "text-destructive font-medium" : "font-medium"}>
                          {row.workerName || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{row.employeeId || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.startTime} - {row.endTime}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={row.workTitle}>{row.workTitle}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isImportDisabled}
            className="gap-2"
          >
            {isImporting ? "Processing..." : `Import ${validCount} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
