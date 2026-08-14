import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";

/**
 * Renders Google / Bing site-verification meta tags from Admin → Settings.
 * Rendered in the root layout inside <Suspense> so it stays a dynamic island
 * (server-rendered per request) without forcing the rest of the page dynamic.
 */
async function VerificationTags() {
  let settings: Record<string, string> = {};
  try {
    const db = await createClient();
    settings = await getSiteSettings(db);
  } catch {
    // fall through — no tags when settings can't be read
  }

  const google = settings.google_site_verification?.trim();
  const bing = settings.bing_site_verification?.trim();
  if (!google && !bing) return null;

  return (
    <>
      {google && <meta name="google-site-verification" content={google} />}
      {bing && <meta name="msvalidate.01" content={bing} />}
    </>
  );
}

export function SiteVerification() {
  return (
    <Suspense fallback={null}>
      <VerificationTags />
    </Suspense>
  );
}
