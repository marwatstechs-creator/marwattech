"use client";

import { useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Your AdSense in-feed ad unit (fluid, card-styled). */
const AD_CLIENT = "ca-pub-4516735837982934";
const AD_SLOT = "9785718572";
const LAYOUT_KEY = "-76+f1-1r-45+e9";
const LOADER_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;

/**
 * In-feed Google AdSense ad rendered in the same card style as the promo cards.
 * Self-contained: loads the adsbygoogle loader for this client if not already
 * present, then pushes the <ins> so the ad fills.
 */
export function InFeedAd() {
  useEffect(() => {
    // Load the loader script for this client exactly once.
    if (!document.querySelector(`script[src="${LOADER_URL}"]`)) {
      const s = document.createElement("script");
      s.async = true;
      s.src = LOADER_URL;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    // Push after the <ins> is in the DOM.
    const t = window.setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore — ad won't fill, page still works
      }
    }, 100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Card className="card-3d flex flex-col overflow-hidden">
      <CardContent className="flex flex-1 items-center justify-center p-5">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOT}
          data-ad-format="fluid"
          data-ad-layout-key={LAYOUT_KEY}
        />
      </CardContent>
    </Card>
  );
}
