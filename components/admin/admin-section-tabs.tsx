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

/**
 * Modern horizontal tab strip rendered in the admin body for the active
 * sidebar group. Sticky under the topbar, horizontally scrollable on small
 * screens, with the active tab highlighted in the brand color.
 */
export function AdminSectionTabs({ items }: { items: SectionTabItem[] }) {
  const pathname = usePathname();
  if (!items.length) return null;

  return (
    <div className="sticky top-16 z-20 -mx-4 mb-6 border-b bg-background/85 backdrop-blur-sm sm:-mx-6 lg:-mx-8">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
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
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/60 hover:bg-accent-hover hover:text-foreground"
              )}
            >
              <AppIcon name={item.icon} size={15} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
