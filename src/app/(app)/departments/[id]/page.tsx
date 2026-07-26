"use client";

import { useParams } from "next/navigation";
import { useDepartment } from "@/features/departments/queries";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { DepartmentDashboard } from "@/features/departments/components/department-dashboard";

export default function DepartmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: department, isLoading, error } = useDepartment(id);

  if (isLoading) return <LoadingSkeleton variant="card" count={3} />;
  if (error || !department) return <div>Department not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={department.name}
        description={department.description || "No description provided."}
        backLink="/departments"
      />

      <DepartmentDashboard departmentId={id} />
    </div>
  );
}
