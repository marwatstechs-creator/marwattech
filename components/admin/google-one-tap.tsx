"use client";

import * as React from "react";
import { toast } from "sonner";

import { handleGoogleOneTap } from "@/lib/actions/google";

type GsiCredentialResponse = { credential?: string; select_by?: string };
type GsiPromptMoment = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
};

const STORAGE_KEY = "mts_onetap_last";
const CONFIG_REASONS = [
  "unregistered_origin",
  "invalid_client",
  "missing_google_client_id",
  "secure_http_required",
  "browser_not_supported",
];

/** Remember the last One Tap outcome so the admin settings page can show it. */
function recordOneTap(type: string, reason?: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ type, reason: reason ?? null, at: Date.now() })
    );
  } catch {
    // ignore
  }
  console.info(`[GoogleOneTap] ${type}${reason ? ` — ${reason}` : ""}`);
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (r: GsiCredentialResponse) => void;
            auto_select?: boolean;
            itp_support?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
            ux_mode?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (momentListener?: (n: GsiPromptMoment) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

/**
 * Google One Tap — renders nothing; on mount it loads the GIS library and
 * displays the One Tap prompt for the configured Client ID. The returned
 * JWT credential is verified server-side, then the user is signed in and
 * redirected to their dashboard.
 */
export function GoogleOneTap({
  mode = "client",
  clientId,
  enabled,
}: {
  mode?: "admin" | "client";
  clientId?: string | null;
  enabled?: boolean;
}) {
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || !clientId || started.current) return;
    // Only attempt once per page view to avoid looping prompts.
    started.current = true;

    let retryOnce: (() => void) | null = null;

    const promptWithTracking = () => {
      window.google?.accounts?.id?.prompt((moment) => {
        let type = "displayed";
        let reason: string | undefined;
        if (moment.isNotDisplayed()) {
          type = "not_displayed";
          reason = moment.getNotDisplayedReason?.() || "unknown_reason";
        } else if (moment.isSkippedMoment()) {
          type = "skipped";
          reason = moment.getSkippedReason?.() || "unknown_reason";
        } else if (moment.isDismissedMoment()) {
          type = "dismissed";
          reason = moment.getDismissedReason?.() || "unknown_reason";
        }
        recordOneTap(type, reason);

        // If Google skipped the on-load prompt for a non-config reason (e.g.
        // it was suppressed or FedCM hiccuped), retry once on the first
        // interaction — One Tap often appears when explicitly re-prompted.
        if (
          type !== "displayed" &&
          reason &&
          !CONFIG_REASONS.includes(reason)
        ) {
          retryOnce = () => {
            if (retryOnce) {
              retryOnce = null;
              window.google?.accounts?.id?.prompt();
            }
          };
          document.addEventListener("pointerdown", retryOnce, { once: true });
          document.addEventListener("keydown", retryOnce, { once: true });
        } else {
          retryOnce = null;
        }
      });
    };

    const initialize = () => {
      window.google?.accounts?.id?.initialize({
        client_id: clientId,
        itp_support: true,
        cancel_on_tap_outside: false,
        // Auto-select a single eligible Google account (smoother "one tap")
        // and explicitly opt into FedCM (Google's recommended prompt path).
        auto_select: true,
        use_fedcm_for_prompt: true,
        context: "signin",
        callback: async (resp) => {
          if (!resp.credential) return;
          const res = await handleGoogleOneTap(resp.credential, mode);
          if (res.ok) {
            toast.success("Signed in with Google");
            // Full redirect so the new session cookie is used on the target page.
            window.location.href = res.url;
          } else {
            toast.error(res.error || "Google sign-in failed. Try again.");
          }
        },
      });
      promptWithTracking();
    };

    if (window.google?.accounts?.id) {
      initialize();
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = initialize;
    document.body.appendChild(s);

    return () => {
      if (retryOnce) {
        document.removeEventListener("pointerdown", retryOnce);
        document.removeEventListener("keydown", retryOnce);
      }
    };
  }, [enabled, clientId, mode]);

  return null;
}
