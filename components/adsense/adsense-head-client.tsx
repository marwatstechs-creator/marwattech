"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { isAdEnabledPath } from "@/lib/ads";

/**
 * Injects the AdSense loader script only on pages that contain ad
 * placements. Because the loader also enables Google Auto ads, this keeps
 * auto ads off every other page. The script is added when the user is on an
 * ad-enabled route and removed when they navigate to a non-ad route.
 */
export function AdSenseHeadClient({ client }: { client: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!client) return;
    const enabled = isAdEnabledPath(pathname ?? "");
    const el = document.getElementById("adsense-loader");

    if (!enabled) {
      el?.remove();
      return;
    }
    if (el) return; // already injected

    const s = document.createElement("script");
    s.id = "adsense-loader";
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }, [client, pathname]);

  return null;
}
