"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
    dataLayer?: unknown[];
  }
}

/** Fire analytics events from the browser (FR-27). */
export function trackEvent(
  event: string,
  properties: Record<string, unknown> = {}
) {
  // Google Analytics via GTM
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, properties);
  }
  // PostHog
  if (typeof window !== "undefined" && window.posthog) {
    window.posthog.capture(event, properties);
  }
  // Microsoft Clarity
  if (
    typeof window !== "undefined" &&
    typeof window.clarity === "function"
  ) {
    window.clarity("event", event);
  }
}
