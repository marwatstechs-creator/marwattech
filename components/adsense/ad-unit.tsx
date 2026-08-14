"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type AdFormat = "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";

/**
 * Renders a Google AdSense <ins> unit and registers it with the loader.
 * - "Smart" by default: data-ad-format="auto" + full-width responsive.
 * - Renders nothing when no ad client is configured.
 */
export function AdUnit({
  adClient,
  slotId,
  format = "auto",
  fullWidthResponsive = true,
  className,
}: {
  adClient?: string | null;
  slotId?: string | null;
  format?: AdFormat | string;
  fullWidthResponsive?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!adClient) return;
    try {
      // Tell AdSense to fill the <ins> that just mounted. Safe to call
      // multiple times — each call matches the next unfilled ins in DOM order.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore — AdSense will not fill, page still works
    }
  }, [adClient]);

  if (!adClient) return null;

  return (
    <div
      className={cn(
        "flex min-h-[90px] w-full items-center justify-center overflow-hidden",
        className
      )}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={slotId || undefined}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
