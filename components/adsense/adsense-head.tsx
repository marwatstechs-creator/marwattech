import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";

/**
 * Injects the AdSense loader <script> into <head> when the AdSense client ID
 * is configured in Admin → Settings. Rendered as a dynamic island so the rest
 * of the page stays static.
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

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      crossOrigin="anonymous"
    />
  );
}

export function AdSenseHead() {
  return (
    <Suspense fallback={null}>
      <AdSenseLoader />
    </Suspense>
  );
}
