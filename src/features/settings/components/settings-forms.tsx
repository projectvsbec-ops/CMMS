"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSetting } from "../queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function SettingsForms() {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();

  // Local state for each category
  const [college, setCollege] = useState<any>({});
  const [workingHours, setWorkingHours] = useState<any>({});
  const [inventory, setInventory] = useState<any>({});
  const [reports, setReports] = useState<any>({});

  useEffect(() => {
    if (settings) {
      settings.forEach(s => {
        if (s.category === "college") setCollege(s.settings_json);
        if (s.category === "working_hours") setWorkingHours(s.settings_json);
        if (s.category === "inventory_defaults") setInventory(s.settings_json);
        if (s.category === "report_preferences") setReports(s.settings_json);
      });
    }
  }, [settings]);

  const handleSave = (category: string, json: any) => {
    updateSetting.mutate({ category, settings_json: json });
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  return (
    <Tabs defaultValue="college" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px] mb-6">
        <TabsTrigger value="college">College</TabsTrigger>
        <TabsTrigger value="working_hours">Working Hours</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="college">
        <Card>
          <CardHeader>
            <CardTitle>College Information</CardTitle>
            <CardDescription>Global details used across reports and the application shell.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>College Name</Label>
              <Input 
                value={college.name || ""} 
                onChange={(e) => setCollege({...college, name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input 
                  value={college.contact_number || ""} 
                  onChange={(e) => setCollege({...college, contact_number: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={college.email || ""} 
                  onChange={(e) => setCollege({...college, email: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={college.address || ""} 
                onChange={(e) => setCollege({...college, address: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Select value={college.time_zone || "UTC"} onValueChange={(v) => v && setCollege({...college, time_zone: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleSave("college", college)} disabled={updateSetting.isPending}>
              Save College Info
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="working_hours">
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>Define default operational hours for attendance and scheduling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input 
                  type="time" 
                  value={workingHours.start_time || "08:00"} 
                  onChange={(e) => setWorkingHours({...workingHours, start_time: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input 
                  type="time" 
                  value={workingHours.end_time || "17:00"} 
                  onChange={(e) => setWorkingHours({...workingHours, end_time: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Break Time (Minutes)</Label>
              <Input 
                type="number" 
                value={workingHours.break_time || "60"} 
                onChange={(e) => setWorkingHours({...workingHours, break_time: e.target.value})} 
              />
            </div>
            <Button onClick={() => handleSave("working_hours", workingHours)} disabled={updateSetting.isPending}>
              Save Working Hours
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="inventory">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Defaults</CardTitle>
            <CardDescription>Global settings for material management.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Unit of Measure</Label>
                <Select value={inventory.default_unit || "Pieces"} onValueChange={(v) => v && setInventory({...inventory, default_unit: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pieces">Pieces</SelectItem>
                    <SelectItem value="Kg">Kilograms (Kg)</SelectItem>
                    <SelectItem value="Liters">Liters</SelectItem>
                    <SelectItem value="Meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>System Currency</Label>
                <Select value={inventory.currency || "USD"} onValueChange={(v) => v && setInventory({...inventory, currency: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => handleSave("inventory_defaults", inventory)} disabled={updateSetting.isPending}>
              Save Inventory Defaults
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Report Preferences</CardTitle>
            <CardDescription>Customize the look and feel of exported reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Page Size</Label>
              <Select value={reports.page_size || "A4"} onValueChange={(v) => v && setReports({...reports, page_size: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (Standard)</SelectItem>
                  <SelectItem value="Letter">US Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Report Header Title</Label>
              <Input 
                value={reports.header || ""} 
                onChange={(e) => setReports({...reports, header: e.target.value})} 
                placeholder="e.g. Official Maintenance Report"
              />
            </div>
            <div className="space-y-2">
              <Label>Report Footer Text</Label>
              <Input 
                value={reports.footer || ""} 
                onChange={(e) => setReports({...reports, footer: e.target.value})} 
              />
            </div>
            <Button onClick={() => handleSave("report_preferences", reports)} disabled={updateSetting.isPending}>
              Save Report Preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
