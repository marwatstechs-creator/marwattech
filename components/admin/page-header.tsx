import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icons";

import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <AppIcon name="chevronRight" size={12} className="opacity-50" />}
          {c.href ? (
            <Link href={c.href} className="transition-colors hover:text-foreground">
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground/80">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: Crumb[];
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        {breadcrumb && breadcrumb.length > 0 && <Breadcrumbs items={breadcrumb} />}
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  trend,
  trendUpIsGood = true,
  href,
  accent,
}: {
  icon: IconName;
  label: string;
  value: number | string;
  hint?: string;
  /** Percentage change vs previous period. Shows a small trend chip. */
  trend?: number;
  trendUpIsGood?: boolean;
  href?: string;
  accent?: "primary" | "gold" | "azure" | "emerald";
}) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "icon-3d-tile grid size-10 place-items-center rounded-lg",
            accent === "gold" && "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
            accent === "azure" && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
            accent === "emerald" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            (!accent || accent === "primary") && "bg-primary/10 text-primary"
          )}
        >
          <AppIcon name={icon} size={20} />
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend >= 0 === trendUpIsGood
                ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/12 text-red-600 dark:text-red-400"
            )}
          >
            <AppIcon name={trend >= 0 ? "arrowUpRight" : "arrowDown"} size={12} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={cn("font-display mt-4 text-3xl font-bold")}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </>
  );

  const cls = "card-3d lift-3d block rounded-xl border bg-card p-5";
  if (href) {
    return (
      <Link href={href} className={cn(cls, "transition-colors hover:border-primary/40")}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

