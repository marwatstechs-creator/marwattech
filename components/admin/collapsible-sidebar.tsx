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
      className="sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r bg-background transition-[width] duration-300 ease-in-out lg:block"
      style={{ width: open ? "16rem" : "4rem" }}
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
              <img
                src="/assets/logo-light-square.svg"
                alt="Marwat Tech"
                className="size-8 dark:hidden"
              />
              <img
                src="/assets/logo-dark-square.svg"
                alt="Marwat Tech"
                className="hidden size-8 dark:block"
              />
            </Link>
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
                  "nav-item-3d flex items-center rounded-lg text-sm font-medium transition-colors",
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
