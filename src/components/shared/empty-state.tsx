import { cn } from "@/lib/utils";
import { SearchX, PackageOpen, FileX, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyVariant = "default" | "search" | "no-data" | "error";

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const VARIANT_CONFIG: Record<
  EmptyVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    defaultDescription: string;
  }
> = {
  default: {
    icon: Inbox,
    defaultTitle: "Nothing here yet",
    defaultDescription: "Get started by creating your first entry.",
  },
  search: {
    icon: SearchX,
    defaultTitle: "No results found",
    defaultDescription: "Try adjusting your search or filter criteria.",
  },
  "no-data": {
    icon: PackageOpen,
    defaultTitle: "No data available",
    defaultDescription: "There is no data to display at the moment.",
  },
  error: {
    icon: FileX,
    defaultTitle: "Something went wrong",
    defaultDescription: "An error occurred while loading the data.",
  },
};

export function EmptyState({
  variant = "default",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">
        {title ?? config.defaultTitle}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description ?? config.defaultDescription}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
