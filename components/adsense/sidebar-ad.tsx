"use client";

import { useEffect, useRef, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import type { EnabledAd } from "@/lib/db/content";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const STICKY_TOP = 96; // stick this far below the top of the viewport
const GAP_TOP = 24; // gap below the hero / content start
const GAP_BOTTOM = 24; // gap above the footer

/**
 * Sticky left/right sidebar ad (vertical "wide skyscraper").
 *
 * Only shows on very wide desktop screens (>= 1700px) where there is empty
 * gutter beside the centered content — it stays hidden on laptops, tablets
 * and phones so it never covers the page.
 *
 * Positioning: it lives in the MAIN section (below the hero/breadcrumb) and
 * follows the scroll, locking to a fixed offset while reading, then stops
 * before the footer so it never overlaps it.
 */
export function SidebarAd({
  ad,
  side = "right",
}: {
  ad: EnabledAd;
  side?: "left" | "right";
}) {
  const [dismissed, setDismissed] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (dismissed || !ad?.ad_client) return;
    const el = asideRef.current;
    if (!el) return;

    // Push the ad to AdSense once mounted.
    const t = window.setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore — ad won't fill, page still works
      }
    }, 150);

    // Clamp the fixed ad between the main-content start and the footer so it
    // never floats over the hero/breadcrumb nor overlaps the footer.
    const update = () => {
      const footer = document.querySelector("footer");
      const main = document.querySelector("main");
      const marker = main?.querySelector("[data-sidebar-start]");
      const hero = main
        ? main.querySelector(":scope > section:first-child")
        : null;
      const scrollY = window.scrollY || window.pageYOffset;
      const elH = el.offsetHeight || 400;

      // Absolute (page) Y where the ad may begin — after the hero/breadcrumb.
      let startAbs: number;
      if (marker) {
        startAbs = marker.getBoundingClientRect().top + scrollY;
      } else if (hero) {
        startAbs = hero.getBoundingClientRect().bottom + scrollY + GAP_TOP;
      } else {
        startAbs = (main?.getBoundingClientRect().top ?? 0) + scrollY + GAP_TOP;
      }

      // Absolute (page) Y where the content ends (top of the footer).
      const endAbs = footer
        ? footer.getBoundingClientRect().top + scrollY
        : document.documentElement.scrollHeight - GAP_BOTTOM;

      // Where the ad would sit if stuck at the sticky offset, clamped inside
      // the main section so it stops before the footer. The footer clamp is
      // authoritative (no viewport floor) so the ad can never overlap the
      // footer — at the very bottom its bottom sits GAP_BOTTOM above it.
      let pageTop = STICKY_TOP + scrollY;
      pageTop = Math.max(startAbs, pageTop);
      pageTop = Math.min(pageTop, endAbs - elH - GAP_BOTTOM);
      pageTop = Math.max(16, pageTop); // edge-case safeguard for tiny pages

      el.style.top = `${pageTop - scrollY}px`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [dismissed, ad?.ad_client]);

  if (dismissed || !ad?.ad_client) return null;

  return (
    <aside
      ref={asideRef}
      aria-label="Advertisement"
      style={{ top: STICKY_TOP }}
      className={cn(
        "fixed z-40 hidden w-[160px] min-[1700px]:block",
        side === "left" ? "left-4" : "right-4"
      )}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg">
        <button
          type="button"
          aria-label="Close ad"
          onClick={() => setDismissed(true)}
          className="absolute right-1 top-1 z-10 grid size-5 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <AppIcon name="close" size={11} />
        </button>
        <div className="flex min-h-[300px] w-full items-center justify-center bg-card p-1.5">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={ad.ad_client}
            data-ad-slot={ad.slot_id || undefined}
            data-ad-format={ad.format || "vertical"}
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </aside>
  );
}
