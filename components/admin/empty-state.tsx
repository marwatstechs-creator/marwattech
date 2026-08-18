import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon = "box",
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center",
        className
      )}
    >
      <div className="icon-3d-tile grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <AppIcon name={icon} size={24} />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <AppIcon name="plus" size={16} />
          {action.label}
        </Link>
      )}
    </div>
  );
}
