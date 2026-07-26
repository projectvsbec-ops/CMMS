"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DataManagement } from "@/features/settings/components/data-management";

export default function DataManagementPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Data Backup & Import"
        description="Safely backup your system records or bulk import data from external spreadsheets."
      />

      <DataManagement />
    </div>
  );
}
