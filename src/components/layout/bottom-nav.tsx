"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  ClipboardCheck,
  Hammer,
  Package,
  Menu,
  Circle,
} from "lucide-react";

// Static icon map for bottom nav items
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ClipboardCheck,
  Hammer,
  Package,
  Menu,
};

interface BottomNavProps {
  onMoreClick: () => void;
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isMore = item.href === "#more";
          const isActive =
            !isMore &&
            (pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href)));
          const IconComponent = ICON_MAP[item.icon] ?? Circle;

          if (isMore) {
            return (
              <button
                key="more"
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 text-muted-foreground active:scale-95 transition-transform"
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.title}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-2 active:scale-95 transition-transform",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
