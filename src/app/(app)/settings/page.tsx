"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SettingsForms } from "@/features/settings/components/settings-forms";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Database, Activity } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Settings"
        description="Configure application preferences, master data, and system behavior."
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/settings/data")} className="gap-2">
            <Database className="h-4 w-4" /> Data Management
          </Button>
          <Button variant="outline" onClick={() => router.push("/settings/activity")} className="gap-2">
            <Activity className="h-4 w-4" /> Activity Logs
          </Button>
        </div>
      </PageHeader>

      <SettingsForms />
    </div>
  );
}
