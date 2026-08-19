import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";

/**
 * OAuth callback (Supabase). Exchanges the `code` from the identity provider
 * (Google, etc.) for a session cookie, then redirects to the intended page.
 * Lives outside /admin so middleware doesn't block it pre-exchange.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  // Public origin from the forwarded headers (Cloudflare) — `request.url`
  // resolves to the server's internal 0.0.0.0:3000 address behind the proxy,
  // which made the post-login redirect go to a dead 0.0.0.0 URL.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? SITE.url.replace(/^https?:\/\//, "");
  const origin = `${proto}://${host}`;

  if (code) {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback`);
}
