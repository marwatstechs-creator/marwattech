"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";

export type SectionTabItem = {
  label: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
};

export type SectionTabsProps = {
  groupLabel: string;
  groupIcon: Parameters<typeof AppIcon>[0]["name"];
  items: SectionTabItem[];
};

/**
 * Modern section header + horizontal tab strip shown in the admin body for
 * the active sidebar group. Renders the group title/icon on the left, then a
 * scrollable pill tab row where the active tab is filled with the brand
 * gradient and a soft shadow.
 */
export function AdminSectionTabs({ groupLabel, groupIcon, items }: SectionTabsProps) {
  const pathname = usePathname();
  if (!items.length) return null;

  return (
    <div className="sticky top-16 z-20 -mx-4 mb-6 border-b bg-background/85 backdrop-blur-sm sm:-mx-6 lg:-mx-8">
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        {/* Group title */}
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className="grid size-8 place-items-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #8b7dd4 0%, #5f4fa8 100%)" }}
          >
            <AppIcon name={groupIcon} size={16} className="text-white" />
          </span>
          <h2 className="font-display text-lg font-bold tracking-tight">{groupLabel}</h2>
        </div>

        {/* Tab pills */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-3">
          {items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? "text-white shadow-lg"
                    : "border border-border bg-card text-foreground/60 hover:bg-accent-hover hover:text-foreground"
                )}
                style={
                  active
                    ? {
                        background: "linear-gradient(180deg, #8b7dd4 0%, #7464c6 55%, #5f4fa8 100%)",
                        boxShadow: "0 6px 16px rgba(88,74,176,0.35)",
                      }
                    : undefined
                }
              >
                <AppIcon name={item.icon} size={15} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
