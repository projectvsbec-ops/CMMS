"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Local Error Caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-card rounded-xl border border-destructive/20 p-8 text-center space-y-4">
      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">Something went wrong!</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        An error occurred while rendering this section. You can try recovering by refreshing the component.
      </p>
      
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-left bg-muted p-2 rounded w-full max-w-lg overflow-auto mt-4 font-mono text-destructive">
          {error.message}
        </div>
      )}

      <Button onClick={() => reset()} variant="outline" className="mt-4 gap-2 border-destructive text-destructive hover:bg-destructive/10">
        <RefreshCw className="h-4 w-4" /> Try Again
      </Button>
    </div>
  );
}
