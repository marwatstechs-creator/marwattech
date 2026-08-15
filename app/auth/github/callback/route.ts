import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeGitHubCode, type GitHubLoginMode } from "@/lib/github";
import { signInWithVerifiedEmail } from "@/lib/auth";

/**
 * "Sign in with GitHub" callback.
 * Exchanges the GitHub authorize `code` for the user's identity, matches it
 * to a Supabase account (auto-creating a client account when needed), then
 * signs them in via a server-side magic-link OTP (no password change).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const mode: GitHubLoginMode = searchParams.get("mode") === "client" ? "client" : "admin";
  const redirectUri = `${origin}/auth/github/callback?mode=${mode}`;
  const fail = (err = "github") => NextResponse.redirect(`${origin}/admin/login?error=${err}`);

  if (!code) return fail();

  // Verify the OAuth state (login-CSRF protection).
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const expected = cookieStore.get("oauth_state_github")?.value;
  cookieStore.delete("oauth_state_github");
  if (!state || !expected || state !== expected) return fail("github");

  try {
    const identity = await exchangeGitHubCode(code, redirectUri);
    const { target, error } = await signInWithVerifiedEmail({
      email: identity.email,
      name: identity.name,
      picture: identity.picture,
    });
    if (error) return fail("github");
    return NextResponse.redirect(`${origin}${target}`);
  } catch {
    return fail("github");
  }
}
