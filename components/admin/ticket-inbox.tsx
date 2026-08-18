"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, timeAgo } from "@/lib/utils";
import { statusLabel, statusTone, type TicketRow } from "@/components/admin/ticket-thread";
import { EmptyState } from "@/components/admin/empty-state";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_on_customer", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function TicketInbox({ tickets }: { tickets: TicketRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"updated" | "created">("updated");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = tickets.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (!needle) return true;
      return (
        (t.subject ?? "").toLowerCase().includes(needle) ||
        t.email.toLowerCase().includes(needle) ||
        t.name.toLowerCase().includes(needle) ||
        t.issue_type.toLowerCase().includes(needle)
      );
    });
    const key = sort === "created" ? "created_at" : "updated_at";
    return [...rows].sort((a, b) => {
      const av = new Date(a[key] ?? a.created_at).getTime();
      const bv = new Date(b[key] ?? b.created_at).getTime();
      return bv - av;
    });
  }, [tickets, q, status, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length };
    for (const t of tickets) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [tickets]);

  return (
    <div>
      {/* Filters + search */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                status === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent-hover hover:text-foreground"
              )}
            >
              {f.label}
              <span className="ml-1 opacity-60">{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <AppIcon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tickets…"
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "updated" | "created")}
            className="h-9 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Sort tickets"
          >
            <option value="updated">Last updated</option>
            <option value="created">Newest</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="chat"
          title="No tickets found"
          description={
            q || status !== "all"
              ? "Try a different search term or filter."
              : "Support tickets from customers will appear here."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent-hover sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium group-hover:text-primary">
                    {t.subject ?? "Support ticket"}
                  </p>
                  <Badge variant={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
                  <Badge variant="secondary" className="hidden md:inline-flex">
                    {t.issue_type}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {t.name} · {t.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <Badge
                  variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "gold" : "outline"}
                >
                  {t.priority}
                </Badge>
                <span className="whitespace-nowrap">{timeAgo(t.updated_at ?? t.created_at)}</span>
                <AppIcon name="chevronRight" size={16} className="opacity-40 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
