import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeGoogleCode, type GoogleLoginMode } from "@/lib/google";
import { signInWithVerifiedEmail } from "@/lib/auth";

/**
 * "Sign in with Google" callback.
 * Exchanges the Google authorize `code` for the user's identity, matches it
 * to a Supabase account (auto-creating a client account when needed), then
 * signs them in via a server-side magic-link OTP (no password change).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const fail = (err = "google") => NextResponse.redirect(`${origin}/admin/login?error=${err}`);

  if (!code) return fail();

  // Verify the OAuth state (login-CSRF protection). The state carries both the
  // CSRF token and the login mode ("admin:<uuid>" / "client:<uuid>") because
  // Google rejects query strings in the redirect URI (Error 400
  // redirect_uri_mismatch), so the mode can't travel in the URI itself.
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const expected = cookieStore.get("oauth_state_google")?.value;
  cookieStore.delete("oauth_state_google");
  if (!state || !expected || state !== expected) return fail("google");

  const mode: GoogleLoginMode = state.startsWith("client:") ? "client" : "admin";
  const redirectUri = `${origin}/auth/google/callback`;

  try {
    const identity = await exchangeGoogleCode(code, redirectUri);
    const { target, error } = await signInWithVerifiedEmail({
      email: identity.email,
      name: identity.name,
      picture: identity.picture,
    });
    if (error) return fail("google");
    return NextResponse.redirect(`${origin}${target}`);
  } catch {
    return fail("google");
  }
}
