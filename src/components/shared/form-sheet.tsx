"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  onSubmit?: (e: React.FormEvent) => void;
  isPending?: boolean;
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  onSubmit,
  isPending,
}: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        <ScrollArea className="flex-1">
          <form id="sheet-form" onSubmit={onSubmit} className="px-6 py-4">
            {children}
          </form>
        </ScrollArea>
        <SheetFooter className="p-6 border-t shrink-0">
          <Button type="submit" form="sheet-form" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
