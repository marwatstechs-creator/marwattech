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
};

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

    const initialize = () => {
      window.google?.accounts?.id?.initialize({
        client_id: clientId,
        itp_support: true,
        cancel_on_tap_outside: false,
        auto_select: false,
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
      window.google?.accounts?.id?.prompt(() => {
        // One Tap may be skipped when the user has no eligible Google session;
        // that's fine — they can use the regular buttons below.
      });
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
  }, [enabled, clientId, mode]);

  return null;
}
