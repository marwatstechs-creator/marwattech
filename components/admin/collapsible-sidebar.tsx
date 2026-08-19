"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Logo } from "@/components/marketing/logo";
import { cn } from "@/lib/utils";

export type CollapsibleSidebarItem = {
  label: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
  section?: string; // e.g. "MANAGE", "CONTENT", "SYSTEM" — rendered as a small label
  count?: number; // number of children → tiny badge
};

/* ── Brand colors — Purple palette ──────────────────────────────────── */
const PURPLE = "#7464c6";
const PURPLE_DARK = "#5f4fa8";

/** Renders the nav items (no section label text). */
function renderItems(
  items: CollapsibleSidebarItem[],
  isActive: (href: string) => boolean,
  open: boolean
) {
  return items.map((item) => {
    const active = isActive(item.href);
    return (
      <div key={item.href} className={cn(!open && "flex flex-col items-center")}>
        <Link
          href={item.href}
          title={!open ? item.label : undefined}
          className={cn(
            "nav-item-3d group relative flex items-center rounded-xl text-sm font-semibold transition-all",
            open ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5",
            active
              ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-sm"
              : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
          )}
        >
          {/* Active left accent bar */}
          {active && (
            <span
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
              style={{ background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.4) 100%)" }}
            />
          )}
          {/* Icon tile */}
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-lg transition-colors",
              open ? "size-8" : "size-9",
              active
                ? "bg-white/20"
                : "bg-primary/10 text-primary group-hover:bg-primary/15"
            )}
          >
            <AppIcon name={item.icon} size={17} className={cn(active && "text-white")} />
          </span>
          {open && (
            <>
              <span className="flex-1 truncate whitespace-nowrap">{item.label}</span>
              {item.count && item.count > 1 ? (
                <span
                  className={cn(
                    "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold",
                    active ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.count}
                </span>
              ) : (
                <AppIcon
                  name="arrowRight"
                  size={14}
                  className={cn("opacity-40 transition-transform", active && "text-white")}
                />
              )}
            </>
          )}
        </Link>
      </div>
    );
  });
}

/**
 * Gmail-style collapsible sidebar (grouped parents).
 * - Collapsed by default: a narrow icon rail (4rem).
 * - Hovering slides it open (with text); leaving collapses it again.
 * - The pin (menu) toggle in the header "sticks" it open; clicking again
 *   collapses it. Width animates smoothly.
 */
export function CollapsibleSidebar({
  items,
  isActive,
  pinned,
  onOpenChange,
  footer,
}: {
  items: CollapsibleSidebarItem[];
  isActive: (href: string) => boolean;
  pinned: boolean;
  onOpenChange?: (open: boolean) => void;
  footer?: (open: boolean) => React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return (
    <aside
      className="glass sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r transition-[width] duration-300 ease-in-out lg:block"
      style={{ width: open ? "16.5rem" : "4.5rem" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={cn("flex h-full flex-col", !open && "items-center")}>
        {/* Header: square logo when collapsed, full logo when open */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b px-3",
            open ? "justify-start" : "justify-center"
          )}
        >
          {open ? (
            <Logo markClassName="size-8" className="[&>span:last-child]:text-base" />
          ) : (
            <Link href="/" aria-label="Marwat Tech — Home" className="grid place-items-center">
              <span className="grid size-9 place-items-center overflow-hidden rounded-xl border bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                <img
                  src="/assets/logo-light-square.svg"
                  alt="Marwat Tech"
                  className="h-full w-full object-contain p-0.5 dark:hidden"
                />
                <img
                  src="/assets/logo-dark-square.svg"
                  alt="Marwat Tech"
                  className="hidden h-full w-full object-contain p-0.5 dark:block"
                />
              </span>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden", open ? "space-y-0.5 p-3" : "space-y-1.5 p-2")}>
          {renderItems(items, isActive, open)}
        </nav>

        {/* Footer */}
        {footer ? (
          <div className={cn("shrink-0 border-t", open ? "p-3" : "p-2")}>{footer(open)}</div>
        ) : null}
      </div>
    </aside>
  );
}
