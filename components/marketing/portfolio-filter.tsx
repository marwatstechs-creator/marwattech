"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PORTFOLIO_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PortfolioFilter() {
  const pathname = usePathname();
  const current = pathname.replace("/portfolio", "") || "/";

  return (
    <nav
      aria-label="Portfolio filter"
      className="mb-10 flex flex-wrap items-center justify-center gap-2"
    >
      {PORTFOLIO_CATEGORIES.map((cat) => {
        const href = cat.slug === "all" ? "/portfolio" : `/portfolio/${cat.slug}`;
        const active =
          cat.slug === "all" ? current === "/" : current === `/${cat.slug}`;
        return (
          <Link
            key={cat.slug}
            href={href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-foreground/80 hover:border-primary/50 hover:text-primary"
            )}
          >
            {cat.label}
          </Link>
        );
      })}
    </nav>
  );
}
