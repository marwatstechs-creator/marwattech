"use client";

import { useMemo, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/status-badge";
import { RowActions } from "@/components/admin/row-actions";
import { AsyncSwitch } from "@/components/admin/async-switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { cn, formatDate } from "@/lib/utils";

export type AdminColumn<T> = {
  /** Field key on the row used for display + sorting. */
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  /** For type "title": render this sub-field (e.g. slug) below the main value. */
  subKey?: string;
  type?: "text" | "title" | "status" | "boolean" | "date" | "switch" | "progress" | "badge";
  /** For type "switch": server action toggling the boolean field (direct ref). */
  switchAction?: (id: string, value: boolean) => Promise<{ error?: string } | { ok: boolean }>;
  switchLabel?: string;
  /** For type "badge": value → badge variant + optional label map. */
  badgeMap?: Record<string, "default" | "secondary" | "gold" | "outline" | "azure" | "destructive">;
  badgeLabels?: Record<string, string>;
};

export type AdminTableActions = {
  editBase: string;
  viewBase?: string;
  slugKey?: string;
  statusKey: string;
  statusOptions: string[];
  onStatusChange?: (
    id: string,
    status: string
  ) => Promise<{ error?: string } | { ok: boolean }>;
  onDelete?: (id: string) => Promise<{ error?: string } | { ok: boolean }>;
  label: string;
};

const PAGE_SIZE = 10;

export function AdminTable<T extends { id: string }>({
  rows,
  columns,
  searchKeys = [],
  searchPlaceholder = "Search…",
  statusOptions,
  statusKey = "status",
  pageSize = PAGE_SIZE,
  loading = false,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  actions,
}: {
  rows: T[];
  columns: AdminColumn<T>[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  statusOptions?: string[];
  statusKey?: string;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href: string };
  actions?: AdminTableActions;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (status !== "all" && String(r[statusKey as keyof T] ?? "") !== status) return false;
      if (!needle) return true;
      return searchKeys.some((k) =>
        String(r[k as keyof T] ?? "").toLowerCase().includes(needle)
      );
    });
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
      });
    }
    return out;
  }, [rows, q, status, sortKey, sortDir, searchKeys, statusKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    if (statusOptions) {
      for (const s of statusOptions) c[s] = rows.filter((r) => String(r[statusKey as keyof T] ?? "") === s).length;
    }
    return c;
  }, [rows, statusOptions, statusKey]);

  return (
    <div>
      {/* Toolbar: search + status filter */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {statusOptions && (
          <div className="flex flex-wrap gap-1.5">
            {["all", ...statusOptions].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatus(s); setPage(1); }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent-hover hover:text-foreground"
                )}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
                <span className="ml-1 opacity-60">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
        )}
        {searchKeys.length > 0 && (
          <div className="relative md:w-72">
            <AppIcon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(col.className, col.sortable && "cursor-pointer select-none")}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <AppIcon
                        name={sortKey === col.key ? (sortDir === "asc" ? "arrowUpRight" : "arrowDown") : "chevronRight"}
                        size={12}
                        className={cn(
                          "transition-opacity",
                          sortKey === col.key ? "opacity-100" : "opacity-30"
                        )}
                      />
                    )}
                  </span>
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                  {actions && <TableCell><div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="py-8">
                  <EmptyState
                    icon="box"
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="border-0 bg-transparent"
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.type === "status" ? (
                        <StatusBadge status={String(row[col.key as keyof T] ?? "")} />
                      ) : col.type === "boolean" ? (
                        row[col.key as keyof T] ? (
                          <span className="text-yellow-500" aria-label="Yes">★</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )
                      ) : col.type === "date" ? (
                        <span className="text-muted-foreground">
                          {formatDate(String(row[col.key as keyof T] ?? ""))}
                        </span>
                      ) : col.type === "switch" ? (
                        <AsyncSwitch
                          itemId={row.id}
                          checked={Boolean(row[col.key as keyof T])}
                          action={col.switchAction as never}
                          label={col.switchLabel ?? "Item"}
                        />
                      ) : col.type === "progress" ? (
                        (() => {
                          const pct = Math.min(100, Math.max(0, Number(row[col.key as keyof T] ?? 0)));
                          return (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{pct}%</span>
                            </div>
                          );
                        })()
                      ) : col.type === "badge" ? (
                        (() => {
                          const raw = String(row[col.key as keyof T] ?? "");
                          const variant = col.badgeMap?.[raw] ?? "outline";
                          const label = col.badgeLabels?.[raw] ?? raw.replace(/_/g, " ");
                          return <Badge variant={variant}>{label}</Badge>;
                        })()
                      ) : col.type === "title" ? (
                        <div className="min-w-0">
                          <p className="truncate font-medium">{String(row[col.key as keyof T] ?? "")}</p>
                          {col.subKey && (
                            <p className="truncate text-xs text-muted-foreground">
                              {String(row[col.subKey as keyof T] ?? "")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{String(row[col.key as keyof T] ?? "—")}</span>
                      )}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right">
                      <RowActions
                        itemId={row.id}
                        editHref={`${actions.editBase}${row.id}`}
                        viewHref={
                          actions.viewBase && actions.slugKey
                            ? `${actions.viewBase}${String(row[actions.slugKey as keyof T] ?? "")}`
                            : undefined
                        }
                        status={String(row[actions.statusKey as keyof T] ?? "")}
                        statusOptions={actions.statusOptions}
                        onStatusChange={actions.onStatusChange as never}
                        onDelete={actions.onDelete as never}
                        label={actions.label}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: row count + pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {paged.length} of {filtered.length}
            {status !== "all" ? ` ${status.replace("_", " ")}` : ""} item{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <AppIcon name="chevronLeft" size={15} />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <AppIcon name="chevronRight" size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
