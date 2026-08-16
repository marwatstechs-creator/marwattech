import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangePaypalIdentity, type PaypalLoginMode } from "@/lib/payments/paypal-identity";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Log in with PayPal" callback.
 * Exchanges the PayPal authorize `code` for the user's identity, matches it to
 * a Supabase account (auto-creating a client account when needed), then signs
 * them in via a server-side magic-link OTP (no password change required).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const fail = () => NextResponse.redirect(`${origin}/admin/login?error=paypal`);

  if (!code) return fail();

  // Verify the OAuth state (login-CSRF protection). The state carries both the
  // CSRF token and the login mode ("admin:<uuid>" / "client:<uuid>") because
  // PayPal rejects query strings in the redirect URI, so the mode can't travel
  // in the URI itself.
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const expected = cookieStore.get("oauth_state_paypal")?.value;
  cookieStore.delete("oauth_state_paypal");
  if (!state || !expected || state !== expected) return fail();

  const mode: PaypalLoginMode = state.startsWith("client:") ? "client" : "admin";
  const redirectUri = `${origin}/auth/paypal/callback`;

  try {
    const identity = await exchangePaypalIdentity(code, redirectUri);
    const email = identity.email?.trim().toLowerCase();
    if (!email) return NextResponse.redirect(`${origin}/admin/login?error=paypal_no_email`);

    const admin = createAdminClient();

    // 1) Find the account by email; auto-create a client account if missing.
    const { data: users } = await admin.auth.admin.listUsers();
    let user = users?.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: identity.name ?? email.split("@")[0] },
      });
      if (createErr) return fail();
      user = created?.user ?? undefined;
    }
    if (!user) return fail();

    // 2) Generate a magic-link OTP and complete it server-side (sets the cookie).
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const token = linkData?.properties?.hashed_token;
    if (!token) return fail();

    const db = await createClient();
    const { error: verifyErr } = await db.auth.verifyOtp({
      email,
      token,
      type: "magiclink",
    });
    if (verifyErr) return fail();

    // 3) Route to the right dashboard based on role.
    const {
      data: { user: sessUser },
    } = await db.auth.getUser();
    let isStaff = false;
    if (sessUser) {
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", sessUser.id)
        .single();
      isStaff = ["super_admin", "editor", "support"].includes(String(profile?.role));
    }
    const target = mode === "client" ? "/client" : isStaff ? "/admin" : "/client";
    return NextResponse.redirect(`${origin}${target}`);
  } catch {
    return fail();
  }
}
