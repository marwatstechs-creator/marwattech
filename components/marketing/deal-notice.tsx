"use client";

import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";

/**
 * Top banner: urges visitors to come back regularly so they don't miss deals,
 * with a bookmark helper. Used on the Free Courses + Promo Codes pages.
 */
export function DealNotice() {
  const bookmark = () => {
    toast("Bookmark this page", {
      description: "Press Cmd/Ctrl + D so you never miss a fresh deal.",
    });
  };

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-primary/10 via-gold/10 to-azure/10 p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(248,198,64,0.12),transparent)]"
      />
      {/* Big watermark icon */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 rotate-12 text-gold opacity-[0.08] sm:-right-4"
      >
        <AppIcon name="rocket" size={210} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 -rotate-12 text-primary opacity-[0.06]"
      >
        <AppIcon name="star" size={150} />
      </span>
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
            <AppIcon name="alertCircle" size={22} />
          </span>
          <div className="min-w-0">
            <Badge variant="gold" className="mb-1.5">
              LIMITED-TIME DEALS · REFRESHED EVERY HOUR
            </Badge>
            <p className="font-display text-lg font-bold leading-snug sm:text-xl">
              Come back again &amp; again — don&apos;t lose what you&apos;re looking for. 🔥
            </p>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              New courses drop all the time and coupons expire <strong>fast</strong>. If you
              come late, the free course you wanted may already be gone. Bookmark this page
              and check back often — we always show the newest deals.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={bookmark}
          className="btn-3d-gold inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          <AppIcon name="star" size={16} />
          Bookmark this page
        </button>
      </div>
    </div>
  );
}
