"use client";

import * as React from "react";
import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";

export type StudySubjectCardData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructor: string | null;
  category: string | null;
  color: string | null;
  week_count: number;
  slide_count: number;
};

function readProgress(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Subject card with a client-side "weeks completed" progress indicator. */
export function StudySubjectCard({ subject }: { subject: StudySubjectCardData }) {
  const storageKey = `study-progress:${subject.id}`;
  const [done, setDone] = React.useState<string[]>([]);

  React.useEffect(() => {
    setDone(readProgress(storageKey));
  }, [storageKey]);

  const pct = subject.week_count > 0 ? Math.round((done.length / subject.week_count) * 100) : 0;

  return (
    <Link
      href={`/study/${subject.slug}`}
      className="group card-3d flex flex-col rounded-2xl border bg-card p-5 transition hover:border-primary/50 hover:shadow-lg"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
          style={{ backgroundColor: subject.color || "#7464c6" }}
        >
          {subject.name.slice(0, 1).toUpperCase()}
        </span>
        {subject.category && <Badge variant="outline">{subject.category}</Badge>}
      </div>
      <h3 className="font-display text-lg font-semibold group-hover:text-primary">{subject.name}</h3>
      {subject.instructor && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <AppIcon name="team" size={13} />
          {subject.instructor}
        </p>
      )}
      {subject.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{subject.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{subject.week_count} weeks</Badge>
        <Badge variant="gold">{subject.slide_count} slides</Badge>
      </div>

      {subject.week_count > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {done.length}/{subject.week_count} weeks
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}
