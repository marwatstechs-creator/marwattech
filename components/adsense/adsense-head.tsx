import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";
import { AdSenseHeadClient } from "./adsense-head-client";

/**
 * Reads the configured AdSense client ID and renders a client component that
 * injects the AdSense loader (which enables Auto ads) ONLY on pages that have
 * ad placements. Rendered as a dynamic island so the rest of the page stays
 * static.
 */
async function AdSenseLoader() {
  let client = "";
  try {
    const db = await createClient();
    const settings = await getSiteSettings(db);
    client = settings.google_adsense_client?.trim() ?? "";
  } catch {
    // fall through — no script when settings can't be read
  }
  if (!client) return null;

  return <AdSenseHeadClient client={client} />;
}

export function AdSenseHead() {
  return (
    <Suspense fallback={null}>
      <AdSenseLoader />
    </Suspense>
  );
}

