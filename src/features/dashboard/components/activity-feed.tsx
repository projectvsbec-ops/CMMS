"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecentActivityLogs } from "@/features/activity-logs/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Activity, User, CheckSquare, Package, CalendarClock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ActivityFeed() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => getRecentActivityLogs({ limit: 10 }),
    refetchInterval: 60000,
  });

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "workers":
      case "attendance":
        return <User className="h-4 w-4 text-blue-500" />;
      case "work_tasks":
        return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case "inventory_transactions":
      case "inventory_items":
        return <Package className="h-4 w-4 text-amber-500" />;
      case "worker_schedules":
      case "preventive_maintenance":
        return <CalendarClock className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] w-full">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs?.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No recent activity.</div>
          ) : (
            <div className="divide-y">
              {logs?.map((log: any) => (
                <div key={log.id} className="p-4 flex gap-3 hover:bg-muted/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border shadow-sm">
                    {getEntityIcon(log.entity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {log.action}
                    </p>
                    <p className="text-sm text-muted-foreground break-words mt-0.5">
                      {log.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
