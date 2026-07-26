"use client";

import { useWorkAnalytics, useInventoryAnalytics } from "../queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export function OperationalCharts() {
  const { data: workData, isLoading: workLoading } = useWorkAnalytics();
  const { data: invData, isLoading: invLoading } = useInventoryAnalytics();

  if (workLoading || invLoading || !workData || !invData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] w-full rounded-xl" />
        <Skeleton className="h-[350px] w-full rounded-xl" />
        <Skeleton className="h-[350px] w-full rounded-xl" />
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
    );
  }

  const PRIORITY_COLORS: Record<string, string> = {
    "Low": "#94a3b8",
    "Medium": "#3b82f6",
    "High": "#f59e0b",
    "Critical": "#ef4444",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Area Chart: Weekly Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Task Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workData.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" name="Tasks Created" dataKey="created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" name="Tasks Completed" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart: Tasks by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tasks by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {workData.tasksByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workData.tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {workData.tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No task data available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart: Active Tasks by Priority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Tasks by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {workData.tasksByPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workData.tasksByPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]}>
                    {workData.tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No priority data available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart: Top Materials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Consumed Materials (Recent)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {invData.topMaterials.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={invData.topMaterials} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.length > 10 ? val.substring(0,10)+'...' : val} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="used" name="Units Used" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No transaction data available</div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
