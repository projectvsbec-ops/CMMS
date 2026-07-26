import { cn } from "@/lib/utils";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  backLink?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
}

export function PageHeader({
  title,
  description,
  children,
  className,
  backLink,
  action,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-0.5">
        {backLink && (
          <Link
            href={backLink}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 block"
          >
            ← Back
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(children || action) && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {children}
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              {action.icon}
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
