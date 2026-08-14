"use client";

import { Fragment, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { PromoCodeCard, type PromoCodeCardData } from "@/components/marketing/promo-code-card";
import { InFeedAd } from "@/components/adsense/in-feed-ad";
import { cn } from "@/lib/utils";

type TabId = "latest" | "full_paid" | "other" | "udemy";

export function PromoCodesClient({
  latest,
  fullPaid,
  other,
  udemy,
  udemyEnabled,
}: {
  latest: PromoCodeCardData[];
  fullPaid: PromoCodeCardData[];
  other: PromoCodeCardData[];
  udemy: PromoCodeCardData[];
  udemyEnabled: boolean;
}) {
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "latest", label: "Latest Promos", count: latest.length },
    { id: "full_paid", label: "Full-Paid / 100% Off", count: fullPaid.length },
    { id: "other", label: "Other Promos", count: other.length },
    ...(udemyEnabled ? [{ id: "udemy" as TabId, label: "Udemy Deals", count: udemy.length }] : []),
  ];
  // Open on the first tab that actually has content (so the page never looks empty).
  const initialTab = tabs.find((t) => t.count > 0)?.id ?? tabs[0]?.id ?? "latest";
  const [active, setActive] = useState<TabId>(initialTab);

  const items =
    active === "latest"
      ? latest
      : active === "full_paid"
        ? fullPaid
        : active === "other"
          ? other
          : udemy;

  return (
    <div>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Promo code categories"
        className="mb-10 flex flex-wrap gap-2"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors",
              active === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-foreground/70 hover:bg-accent-hover hover:text-foreground"
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                active === t.id
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
          <AppIcon name="dollar" size={40} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">No promos here yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Check back soon — we add new deals regularly.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <Fragment key={c.id}>
              <PromoCodeCard code={c} />
              {i === 5 && <InFeedAd />}
            </Fragment>
          ))}
        </div>
      )}

      {/* Attribution for auto feed */}
      {active === "udemy" && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Udemy deals are sourced from a public community coupon feed and may
          expire quickly — codes are checked regularly.
        </p>
      )}
    </div>
  );
}
