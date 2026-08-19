import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";

/**
 * Renders Google / Bing site-verification meta tags from Admin → Settings.
 * Rendered in the root layout inside <Suspense> so it stays a dynamic island
 * (server-rendered per request) without forcing the rest of the page dynamic.
 */
/**
 * Extracts the verification code from a stored value. Admins sometimes paste
 * the whole `<meta ... />` tag instead of just the code — pull the `content`
 * out in that case so the rendered meta tag is always correct.
 */
function extractCode(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const m = trimmed.match(/content\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : trimmed;
}

async function VerificationTags() {
  let settings: Record<string, string> = {};
  try {
    const db = await createClient();
    settings = await getSiteSettings(db);
  } catch {
    // fall through — no tags when settings can't be read
  }

  const google = extractCode(settings.google_site_verification);
  const bing = extractCode(settings.bing_site_verification);
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
