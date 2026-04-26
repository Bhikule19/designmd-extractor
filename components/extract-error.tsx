"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExtractStore } from "@/lib/store";

export function ExtractError() {
  const error = useExtractStore((s) => s.error);
  const reset = useExtractStore((s) => s.reset);
  if (!error) return null;
  return (
    <div className="w-full max-w-2xl mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
      <div className="flex items-start gap-2">
        <AlertCircle className="size-4 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold">{error.code.replace(/_/g, " ")}</p>
          <p className="mt-1 text-xs">{error.message}</p>
          {error.url && (
            <p className="mt-1 text-xs font-mono break-all">{error.url}</p>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
