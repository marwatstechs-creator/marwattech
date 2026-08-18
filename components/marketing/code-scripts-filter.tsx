"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppIcon } from "@/components/app-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CODE_SCRIPT_CATEGORIES, CODE_SCRIPTS_PATH } from "@/lib/code-scripts";

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-none whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium capitalize transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Blog-style category filter + search for the source-code listing.
 * Sticky below the navbar so filters stay accessible while scrolling.
 */
export function CodeScriptsFilter({
  activeCategory,
  q,
}: {
  activeCategory?: string;
  q?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q ?? "");

  const withQuery = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (extra.category) p.set("category", extra.category);
    if (extra.q) p.set("q", extra.q);
    const s = p.toString();
    return `${CODE_SCRIPTS_PATH}${s ? `?${s}` : ""}`;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(withQuery({ category: activeCategory, q: search.trim() || undefined }));
  };

  return (
    <div className="sticky top-[60px] z-30 -mx-4 mb-8 border-y bg-background/90 px-4 py-3 backdrop-blur-md sm:top-[70px] sm:mx-0 sm:px-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Pill href={withQuery({ q })} active={!activeCategory}>
            All
          </Pill>
          {CODE_SCRIPT_CATEGORIES.map((c) => (
            <Pill
              key={c.slug}
              href={withQuery({ category: c.slug, q })}
              active={activeCategory === c.slug}
            >
              {c.label}
            </Pill>
          ))}
        </div>

        <form onSubmit={submit} className="relative w-full shrink-0 md:w-72">
          <AppIcon
            name="search"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scripts…"
            className="pl-9"
          />
        </form>
      </div>
    </div>
  );
}
