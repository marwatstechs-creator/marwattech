"use client";

import * as React from "react";

import { GoogleOneTap } from "@/components/admin/google-one-tap";
import { getGooglePublicConfig } from "@/lib/actions/google";
import { createClient } from "@/lib/supabase/client";

/**
 * Site-wide Google One Tap. Mounted in the root layout so the slide-in
 * "single-tap sign in" popup appears on EVERY page. Google only shows it
 * when it detects a signed-in Google account in the current browser
 * (Chrome or any other), so it never appears for visitors without a
 * Google session. Skipped when the visitor is already signed in to the
 * app so it never nags logged-in users.
 */
export function GoogleOneTapGlobal() {
  const [cfg, setCfg] = React.useState<{
    enabled: boolean;
    oneTapEnabled: boolean;
    clientId: string | null;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      // Don't prompt visitors who already have an app session.
      try {
        const db = createClient();
        const {
          data: { session },
        } = await db.auth.getSession();
        if (session) return;
      } catch {
        // session check failed — continue to config fetch anyway
      }
      try {
        const c = await getGooglePublicConfig();
        if (active) setCfg(c);
      } catch {
        // ignore — no popup when config can't be read
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!cfg?.enabled || !cfg.oneTapEnabled || !cfg.clientId) return null;
  return <GoogleOneTap mode="client" clientId={cfg.clientId} enabled />;
}
