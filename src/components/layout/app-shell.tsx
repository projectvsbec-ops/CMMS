"use client";

import { useState } from "react";
import { DesktopSidebar, MobileSidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Mobile sidebar (Sheet) */}
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
          {/* Bottom nav spacer on mobile */}
          <div className="h-20 lg:hidden" />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  );
}
