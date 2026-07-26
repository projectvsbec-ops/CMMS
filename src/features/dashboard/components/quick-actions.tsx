"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, UserCheck, CalendarClock, PackagePlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function QuickActions() {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
          onClick={() => router.push("/work?action=new")}
        >
          <Plus className="h-6 w-6 text-primary" />
          <span className="text-xs font-semibold">New Task</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-500/5 transition-all"
          onClick={() => router.push("/attendance")}
        >
          <UserCheck className="h-6 w-6 text-green-500" />
          <span className="text-xs font-semibold">Attendance</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2 hover:border-amber-500 hover:bg-amber-500/5 transition-all"
          onClick={() => router.push("/inventory?action=in")}
        >
          <PackagePlus className="h-6 w-6 text-amber-500" />
          <span className="text-xs font-semibold">Add Stock</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-500/5 transition-all"
          onClick={() => router.push("/schedule?action=new")}
        >
          <CalendarClock className="h-6 w-6 text-purple-500" />
          <span className="text-xs font-semibold">Schedule Work</span>
        </Button>
      </CardContent>
    </Card>
  );
}
