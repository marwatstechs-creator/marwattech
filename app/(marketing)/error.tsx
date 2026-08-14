"use client";

import { useEffect } from "react";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";

/**
 * Marketing segment error boundary. Renders inside the marketing layout, so
 * navbar/footer stay intact when a page throws at runtime.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console so errors are not silently swallowed.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="max-w-md text-center">
        <span className="icon-3d-tile mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AppIcon name="alert" size={30} />
        </span>
        <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this page. Please try again."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>
            <AppIcon name="refresh" size={15} className="mr-1.5" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <a href="/">
              <AppIcon name="home" size={15} className="mr-1.5" />
              Back to home
            </a>
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-muted-foreground/70">Error ID: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
