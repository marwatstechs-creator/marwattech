/**
 * "Log in with PayPal" — PayPal OpenID Connect (Identity API).
 * Server-only. Uses the same gateway keys as the checkout.
 */
import {
  resolvePaypalConfig,
  getPaypalSecret,
} from "@/lib/payments/paypal";

export type PaypalLoginMode = "admin" | "client";

function authBase(env: "sandbox" | "live"): string {
  return env === "live"
    ? "https://www.paypal.com/signin/authorize"
    : "https://www.sandbox.paypal.com/signin/authorize";
}

/** Build the PayPal OAuth authorize URL (redirect the browser here). */
export async function buildPaypalLoginUrl(
  mode: PaypalLoginMode,
  origin: string
): Promise<{ url: string; enabled: boolean }> {
  const cfg = await resolvePaypalConfig();
  if (!cfg.enabled || !cfg.clientId) {
    return { url: "", enabled: false };
  }
  const redirectUri = `${origin}/auth/paypal/callback?mode=${mode}`;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    state: `${mode}-${Date.now()}`,
  });
  return { url: `${authBase(cfg.env)}?${params.toString()}`, enabled: true };
}

export type PaypalIdentity = {
  email: string | null;
  name: string | null;
  verified: boolean;
};

/** Exchange the authorize `code` for the user's identity (email + name). */
export async function exchangePaypalIdentity(
  code: string,
  redirectUri: string
): Promise<PaypalIdentity> {
  const cfg = await resolvePaypalConfig();
  const secret = await getPaypalSecret();
  if (!cfg.enabled || !cfg.clientId || !secret) {
    throw new Error("PAYPAL_NOT_CONFIGURED");
  }

  const auth = Buffer.from(`${cfg.clientId}:${secret}`).toString("base64");
  const tokenRes = await fetch(
    `${cfg.apiBase}/v1/identity/openidconnect/tokenservice`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
      cache: "no-store",
    }
  );
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      `PAYPAL_IDENTITY_TOKEN_FAILED ${tokenData.error ?? tokenRes.status} ${tokenData.error_description ?? ""}`
    );
  }

  const userRes = await fetch(
    `${cfg.apiBase}/v1/identity/openidconnect/userinfo?schema=openid`,
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    }
  );
  const user = (await userRes.json()) as {
    email?: string;
    name?: string;
    verified?: boolean;
    given_name?: string;
    family_name?: string;
  };

  return {
    email: user.email ?? null,
    name:
      user.name ??
      ([user.given_name, user.family_name].filter(Boolean).join(" ") || null),
    verified: Boolean(user.verified),
  };
}
