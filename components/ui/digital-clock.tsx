"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const KARACHI_TZ = "Asia/Karachi";

/**
 * Small live digital watch showing the current time in Karachi (PKT).
 * Used in the dashboard navbars. Renders a neutral placeholder until the
 * client has mounted so there is never a server/client hydration mismatch.
 */
export function DigitalClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className={cn("flex items-center gap-2", className)} aria-hidden>
        <span className="size-1.5 rounded-full bg-emerald-500/50" />
        <span className="font-mono text-sm font-semibold tabular-nums tracking-wider text-muted-foreground">
          --:--:--
        </span>
      </div>
    );
  }

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: KARACHI_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: KARACHI_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(now);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <div className="text-right leading-none">
        <span className="block font-mono text-sm font-semibold tabular-nums tracking-wider text-foreground">
          {time}
        </span>
        <span className="mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {date} · PKT
        </span>
      </div>
    </div>
  );
}
