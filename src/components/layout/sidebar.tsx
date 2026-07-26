"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Shield } from "lucide-react";
import { APP_SHORT_NAME } from "@/lib/constants";
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardCheck,
  Hammer,
  CalendarClock,
  Package,
  BarChart3,
  Settings,
  Circle,
  Map,
} from "lucide-react";

// Static icon map to avoid importing all of lucide-react
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  Map,
  Users,
  ClipboardCheck,
  Hammer,
  CalendarClock,
  Package,
  BarChart3,
  Settings,
};

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const IconComponent = ICON_MAP[item.icon] ?? Circle;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <IconComponent className="h-5 w-5 shrink-0" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// Desktop sidebar — always visible on lg+
export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-card h-full">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold tracking-tight">
          {APP_SHORT_NAME}
        </span>
      </div>

      {/* Links */}
      <ScrollArea className="flex-1 py-2">
        <NavLinks />
      </ScrollArea>
    </aside>
  );
}

// Mobile sidebar — Sheet overlay
export function MobileSidebar({ open, onOpenChange }: SidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
        <SheetHeader className="flex h-14 flex-row items-center gap-2.5 px-5 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <SheetTitle className="text-base font-semibold tracking-tight">
            {APP_SHORT_NAME}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 py-2">
          <NavLinks onClick={() => onOpenChange(false)} />
        </ScrollArea>
        <Separator />
        <div className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Campus Maintenance v0.1
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
