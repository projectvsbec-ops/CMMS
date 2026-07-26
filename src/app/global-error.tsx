"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Critical System Error</h1>
              <p className="text-gray-500 text-sm">
                The CMMS application encountered a critical error. We apologize for the interruption.
              </p>
            </div>

            <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg text-left overflow-auto max-h-32">
              <code className="break-words font-mono">
                {error.message || "Unknown error occurred."}
              </code>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={() => reset()} className="w-full sm:w-auto gap-2">
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full sm:w-auto gap-2">
                <Home className="h-4 w-4" /> Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
