"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (offline cache + installability).
 * Safe no-op if the browser doesn't support service workers.
 */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          /* offline support unavailable — ignore */
        });
    }
  }, []);

  return null;
}
