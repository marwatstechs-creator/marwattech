import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeGitHubCode, type GitHubLoginMode } from "@/lib/github";
import { signInWithVerifiedEmail } from "@/lib/auth";
import { SITE } from "@/lib/constants";

/**
 * "Sign in with GitHub" callback.
 * Exchanges the GitHub authorize `code` for the user's identity, matches it
 * to a Supabase account (auto-creating a client account when needed), then
 * signs them in via a server-side magic-link OTP (no password change).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // Public origin from the forwarded headers (Cloudflare) — `request.url`
  // resolves to the server's internal 0.0.0.0:3000 address behind the proxy,
  // which broke BOTH the GitHub token exchange (redirect_uri mismatch) and
  // the final redirect back to the dashboard.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? SITE.url.replace(/^https?:\/\//, "");
  const origin = `${proto}://${host}`;

  const fail = (err = "github") => NextResponse.redirect(`${origin}/admin/login?error=${err}`);

  if (!code) return fail();

  // Verify the OAuth state (login-CSRF protection). The state carries both the
  // CSRF token and the login mode ("admin:<uuid>" / "client:<uuid>") because
  // GitHub Apps reject query strings in the redirect URI, so the mode can't
  // travel in the URI itself.
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const expected = cookieStore.get("oauth_state_github")?.value;
  cookieStore.delete("oauth_state_github");
  if (!state || !expected || state !== expected) return fail("github");

  const mode: GitHubLoginMode = state.startsWith("client:") ? "client" : "admin";
  const loginPath = mode === "client" ? "/client/login" : "/admin/login";
  const failMode = (err = "github") => NextResponse.redirect(`${origin}${loginPath}?error=${err}`);
  const redirectUri = `${origin}/auth/github/callback`;

  try {
    const identity = await exchangeGitHubCode(code, redirectUri);
    const { target, error } = await signInWithVerifiedEmail({
      email: identity.email,
      name: identity.name,
      picture: identity.picture,
      provider: "github",
    });
    if (error) return failMode("github");
    return NextResponse.redirect(`${origin}${target}`);
  } catch {
    return failMode("github");
  }
}
