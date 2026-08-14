"use client";

import { useEffect, useRef, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import type { EnabledAd } from "@/lib/db/content";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Sticky bottom banner that slides up after the user scrolls.
 * - Desktop (≥768px) shows the main ad unit (slot_id + format).
 * - Mobile shows a different ad unit (mobile_slot_id + mobile_format) when
 *   configured — otherwise the same responsive unit is shown everywhere.
 * - Only the currently-visible device unit is pushed to AdSense (the other is
 *   never mounted), so no hidden/filled ads.
 * - Dismissible via the close button; slides back down when dismissed.
 */
export function StickyAd({ ad }: { ad: EnabledAd }) {
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggeredRef = useRef(false);

  // Slide up after scrolling 300px (once).
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 300 && !triggeredRef.current) {
        triggeredRef.current = true;
        setActive(true);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track desktop vs mobile breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const hasMobile = Boolean(ad?.mobile_slot_id);

  // Push the single currently-visible <ins> once it is mounted & visible.
  useEffect(() => {
    if (!active || dismissed || !ad?.ad_client) return;
    const t = window.setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore — ad won't fill, page still works
      }
    }, 100);
    return () => window.clearTimeout(t);
  }, [active, dismissed, isMobile, hasMobile, ad?.ad_client]);

  if (dismissed || !ad?.ad_client) return null;

  const slot = (isMobile && hasMobile ? ad.mobile_slot_id : ad.slot_id) ?? null;
  const format = isMobile && hasMobile ? ad.mobile_format || "auto" : ad.format || "auto";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-2 transition-transform duration-500 ease-out"
      style={{ transform: active ? "none" : "translateY(120%)" }}
      aria-live="polite"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl">
        <button
          type="button"
          aria-label="Close ad"
          onClick={() => setDismissed(true)}
          className="absolute right-1.5 top-1.5 z-10 grid size-6 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <AppIcon name="close" size={12} />
        </button>
        <div className="flex min-h-[60px] w-full items-center justify-center bg-card p-1.5">
          {active && (
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client={ad.ad_client}
              data-ad-slot={slot || undefined}
              data-ad-format={format}
              data-full-width-responsive="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}
