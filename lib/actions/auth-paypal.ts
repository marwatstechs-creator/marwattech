"use server";

import { headers } from "next/headers";

import { buildPaypalLoginUrl, type PaypalLoginMode } from "@/lib/payments/paypal-identity";

/** Build the PayPal OAuth authorize URL for "Log in with PayPal". */
export async function getPaypalLoginUrl(mode: PaypalLoginMode) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const { url, enabled } = await buildPaypalLoginUrl(mode, origin);
  if (!enabled) {
    return { ok: false as const, notConfigured: true as const };
  }
  return { ok: true as const, url };
}
