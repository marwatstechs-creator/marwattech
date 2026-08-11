"use client";

import * as React from "react";

import { GoogleOneTap } from "@/components/admin/google-one-tap";
import { getGooglePublicConfig } from "@/lib/actions/google";

/**
 * Fetches the public Google config (enabled / one-tap / client id) and
 * renders <GoogleOneTap /> only when it should appear. Renders nothing
 * otherwise, so login pages stay clean.
 */
export function GoogleOneTapLoader({ mode = "client" }: { mode?: "admin" | "client" }) {
  const [cfg, setCfg] = React.useState<{
    enabled: boolean;
    oneTapEnabled: boolean;
    clientId: string | null;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    getGooglePublicConfig()
      .then((c) => {
        if (active) setCfg(c);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!cfg?.enabled || !cfg.oneTapEnabled || !cfg.clientId) return null;
  return <GoogleOneTap mode={mode} clientId={cfg.clientId} enabled />;
}
