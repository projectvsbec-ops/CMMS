"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ReportBuilder } from "@/features/reports/components/report-builder";
import { ReportPreview } from "@/features/reports/components/report-preview";
import { useRunReport, useCreateSavedReport, useSavedReports } from "@/features/reports/queries";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { ReportFilter } from "@/types";
import { toast } from "@/components/ui/toast";
import { Suspense } from "react";

function ReportBuilderContent() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [category, setCategory] = useState<string>("Work");
  const [filters, setFilters] = useState<ReportFilter>({});
  const [reportName, setReportName] = useState<string>("Custom Work Report");
  const [shouldRun, setShouldRun] = useState(false);

  const { data: savedReports } = useSavedReports();
  const createSavedReport = useCreateSavedReport();

  const { data: previewData, isLoading, isFetching } = useRunReport(category, filters, shouldRun);

  useEffect(() => {
    if (loadId && savedReports) {
      const saved = savedReports.find(r => r.id === loadId);
      if (saved) {
        setCategory(saved.category);
        setFilters(saved.filters);
        setReportName(saved.name);
        setShouldRun(true);
      }
    }
  }, [loadId, savedReports]);

  const handleGenerate = (cat: string, newFilters: ReportFilter, name: string) => {
    setCategory(cat);
    setFilters(newFilters);
    setReportName(name);
    setShouldRun(true);
  };

  const handleSaveReport = async () => {
    if (!shouldRun) {
      toast.add({ title: "Run First", description: "Generate the report preview before saving.", type: "error" });
      return;
    }
    
    await createSavedReport.mutateAsync({
      name: reportName,
      category,
      filters,
      description: null,
      is_active: true
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Report Builder"
        description="Filter, generate, and export operational reports."
      >
        <Button onClick={handleSaveReport} disabled={!shouldRun || createSavedReport.isPending} variant="secondary" className="gap-2">
          <Save className="h-4 w-4" /> Save Configuration
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 print:hidden">
        <ReportBuilder onGenerate={handleGenerate} isLoading={isLoading || isFetching} />
      </div>

      {shouldRun && (
        <div className="mt-8 border-t pt-8">
          <ReportPreview 
            data={previewData || []} 
            isLoading={isLoading || isFetching} 
            category={category}
            reportName={reportName}
          />
        </div>
      )}
    </div>
  );
}

export default function ReportBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Report Builder...</div>}>
      <ReportBuilderContent />
    </Suspense>
  );
}
