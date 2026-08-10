"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-semibold text-destructive">Something went wrong</p>
        <p className="text-xs text-muted-foreground max-w-md">{error.message || "An unexpected error occurred."}</p>
        <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
