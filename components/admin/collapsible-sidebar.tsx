"use client";

import Link from "next/link";
import { useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Logo } from "@/components/marketing/logo";
import { cn } from "@/lib/utils";

export type CollapsibleSidebarItem = {
  label: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
};

/**
 * Gmail-style collapsible sidebar.
 * - Collapsed by default: a narrow icon rail (4rem).
 * - Hovering slides it open (with text); leaving collapses it again.
 * - The pin (menu) toggle in the header "sticks" it open; clicking again
 *   collapses it. Width animates smoothly.
 */
export function CollapsibleSidebar({
  items,
  isActive,
  pinned,
  onTogglePin,
  footer,
}: {
  items: CollapsibleSidebarItem[];
  isActive: (href: string) => boolean;
  pinned: boolean;
  onTogglePin: () => void;
  footer?: (open: boolean) => React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r bg-background transition-[width] duration-300 ease-in-out lg:block"
      style={{ width: open ? "16rem" : "4rem" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={cn("flex h-full flex-col", !open && "items-center")}>
        {/* Header: logo + pin toggle */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b",
            open ? "justify-between gap-2 px-4" : "justify-center px-2"
          )}
        >
          <Logo
            markClassName="size-8"
            className={cn(
              "[&>span:last-child]:text-base",
              !open && "[&>span:last-child]:hidden"
            )}
          />
          {open && (
            <button
              type="button"
              onClick={onTogglePin}
              aria-label={pinned ? "Collapse sidebar" : "Pin sidebar open"}
              title={pinned ? "Collapse sidebar (click again)" : "Pin sidebar open"}
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                pinned
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent-hover hover:text-foreground"
              )}
            >
              <AppIcon name="menu" size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 space-y-1 overflow-y-auto overflow-x-hidden", open ? "p-3" : "p-2")}>
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!open ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  open ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
                )}
              >
                <AppIcon name={item.icon} size={18} className="shrink-0" />
                {open && <span className="truncate whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {footer ? (
          <div className={cn("shrink-0 border-t", open ? "p-3" : "p-2")}>{footer(open)}</div>
        ) : null}
      </div>
    </aside>
  );
}
