"use server";

import { cookies, headers } from "next/headers";

import { buildPaypalLoginUrl, type PaypalLoginMode } from "@/lib/payments/paypal-identity";

/** Build the PayPal OAuth authorize URL for "Log in with PayPal". */
export async function getPaypalLoginUrl(mode: PaypalLoginMode) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  // Random state bound to the user's session (login-CSRF protection).
  const state =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `pp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cookieStore = await cookies();
  cookieStore.set("oauth_state_paypal", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 600,
  });

  const { url, enabled } = await buildPaypalLoginUrl(mode, origin, state);
  if (!enabled) {
    return { ok: false as const, notConfigured: true as const };
  }
  return { ok: true as const, url };
}
