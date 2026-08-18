"use client";

import * as React from "react";
import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StudyWeekCardData = {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  pdf_url: string | null;
  slide_count: number;
};

/** Week cards with a "mark as complete" toggle + overall progress (localStorage). */
export function StudyWeekList({
  subjectId,
  subjectSlug,
  weeks,
}: {
  subjectId: string;
  subjectSlug: string;
  weeks: StudyWeekCardData[];
}) {
  const storageKey = `study-progress:${subjectId}`;
  const [done, setDone] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setDone(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDone([]);
    }
  }, [storageKey]);

  function toggle(weekId: string) {
    setDone((prev) => {
      const next = prev.includes(weekId) ? prev.filter((id) => id !== weekId) : [...prev, weekId];
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const pct = weeks.length > 0 ? Math.round((done.length / weeks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {weeks.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">Your progress</span>
            <span className="text-muted-foreground">
              {done.length}/{weeks.length} weeks complete
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {weeks.map((w) => {
          const isDone = done.includes(w.id);
          return (
            <div
              key={w.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-5 transition",
                isDone && "border-primary/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold",
                      isDone ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {w.week_number}
                  </span>
                  <div>
                    <h3 className="font-display font-semibold">{w.title}</h3>
                    {w.description && (
                      <p className="text-xs text-muted-foreground">{w.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggle(w.id)}
                  aria-label={isDone ? "Mark as not complete" : "Mark as complete"}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition",
                    isDone ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary"
                  )}
                >
                  <AppIcon name="check" size={16} />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Badge variant={w.slide_count > 0 ? "gold" : "secondary"}>{w.slide_count} slides</Badge>
                <div className="flex items-center gap-2">
                  {w.pdf_url && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={w.pdf_url} target="_blank" rel="noopener noreferrer">
                        <AppIcon name="download" size={14} className="mr-1.5" />
                        PDF
                      </a>
                    </Button>
                  )}
                  <Button asChild size="sm">
                    <Link href={`/study/${subjectSlug}/${w.week_number}`}>
                      Open <AppIcon name="chevronRight" size={14} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
