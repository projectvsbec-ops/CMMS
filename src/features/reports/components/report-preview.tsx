"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { exportToCSV, exportToExcel } from "../export-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, FileSpreadsheet } from "lucide-react";

interface ReportPreviewProps {
  data: any[];
  isLoading: boolean;
  category: string;
  reportName: string;
}

export function ReportPreview({ data, isLoading, category, reportName }: ReportPreviewProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: reportName,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Generating report...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground border rounded-lg bg-card">
        No data found for the selected filters.
      </div>
    );
  }

  const formatWorkExport = (exportData: any[]) => {
    return exportData.map((item, index) => ({
      "S.no": index + 1,
      "Nature of Work (Title)": item.title || "",
      "Description": item.description || "",
      "Department": item.department?.name || "",
      "Area": item.area?.name || "",
      "Category": item.category?.name || "",
      "Priority": item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : "",
      "Assign Manager": item.manager?.name || "",
      "Created Date": item.created_at ? format(new Date(item.created_at), "yyyy-MM-dd HH:mm") : "",
      "Target Date": item.target_date ? format(new Date(item.target_date), "yyyy-MM-dd") : "",
      "Identified By": item.identified_by || "",
      "Admin Remarks": item.remarks || ""
    }));
  };

  const handleExportCSV = () => {
    const dataToExport = category === "Work" ? formatWorkExport(data) : data;
    exportToCSV(dataToExport, reportName);
  };
  
  const handleExportExcel = () => {
    const dataToExport = category === "Work" ? formatWorkExport(data) : data;
    exportToExcel(dataToExport, reportName);
  };

  // Derive headers from first item
  const sample = data[0] || {};
  const headers = Object.keys(sample).filter(k => typeof sample[k] !== 'object' || sample[k] === null);
  
  if (sample.department?.name) headers.push("department");
  if (sample.worker?.name) headers.push("worker");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="text-green-600 border-green-600/30 hover:bg-green-50">
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
        </Button>
        <Button size="sm" onClick={() => handlePrint()}>
          <Printer className="mr-2 h-4 w-4" /> Print / PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {/* Printable Area */}
          <div ref={componentRef} className="p-8 print:p-0 bg-white text-black min-w-max">
            
            {/* Header for Print */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200 print:block">
              <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">{reportName}</h1>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Category: {category}</span>
                <span>Generated: {format(new Date(), "PPpp")}</span>
              </div>
            </div>

            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b-2 border-gray-800 bg-gray-50 text-gray-900">
                  {headers.map(h => (
                    <th key={h} className="px-4 py-3 font-semibold uppercase">{h.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-gray-50 break-inside-avoid">
                    {headers.map(h => {
                      let val = row[h];
                      if (h === "department") val = row.department?.name;
                      if (h === "worker") val = row.worker?.name;
                      if (typeof val === 'boolean') val = val ? "Yes" : "No";
                      if (!val && val !== 0) val = "-";
                      
                      if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
                        val = format(new Date(val), "MMM dd, yyyy");
                      }
                      
                      return (
                        <td key={h} className="px-4 py-2 text-gray-700 max-w-[200px] truncate" title={String(val)}>
                          {String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-8 text-xs text-center text-gray-400 print:block">
              End of Report. Total Records: {data.length}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Dynamic print styles injected to override tailwind during print */}
      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}</style>
    </div>
  );
}
