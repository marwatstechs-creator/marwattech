/**
 * PayPal integration — Orders API v2 (server-only).
 *
 * Professional approach: the order is CREATED server-side (so the amount is
 * authoritative and can't be tampered with in the browser) and CAPTURED
 * server-side on approval. The browser only renders the PayPal smart
 * buttons (PayPal / Venmo / Pay Later / cards via `enable-funding=card`)
 * and tells the server which order to capture.
 *
 * Keys can come from two places (DB override wins for convenience):
 *   1. Env vars:
 *        PAYPAL_ENV                   = "sandbox" (default) | "live"
 *        NEXT_PUBLIC_PAYPAL_CLIENT_ID = client id (public)
 *        PAYPAL_CLIENT_SECRET         = secret (SERVER ONLY)
 *   2. The `payment_gateways` singleton table (editable from Admin → Settings
 *      → Payment Gateway, so keys can be added later without a redeploy).
 *
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type PaypalEnv = "sandbox" | "live";

export type PaypalConfig = {
  enabled: boolean;
  env: PaypalEnv;
  clientId: string | null;
  hasSecret: boolean;
  apiBase: string;
  source: "env" | "db" | "none";
  webhookId: string | null;
};

function apiBaseFor(env: PaypalEnv): string {
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/** Effective config: env vars first, then the admin-stored gateway row. */
export async function resolvePaypalConfig(): Promise<PaypalConfig> {
  let env: PaypalEnv =
    (process.env.PAYPAL_ENV as PaypalEnv | undefined) === "live"
      ? "live"
      : "sandbox";
  let clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null;
  let secret = process.env.PAYPAL_CLIENT_SECRET || null;
  let webhookId = process.env.PAYPAL_WEBHOOK_ID || null;
  let source: PaypalConfig["source"] = clientId && secret ? "env" : "none";

  try {
    const db = createAdminClient();
    const { data } = await db
      .from("payment_gateways")
      .select("env, client_id, secret, webhook_id")
      .eq("id", true)
      .maybeSingle();
    if (data) {
      if (data.env === "live" || data.env === "sandbox") env = data.env;
      if (data.client_id) clientId = data.client_id;
      if (data.secret) secret = data.secret;
      if (data.webhook_id) webhookId = data.webhook_id;
      if (clientId && secret) source = "db";
    }
  } catch {
    // DB not reachable — fall back to env-only values above.
  }

  return {
    enabled: Boolean(clientId && secret),
    env,
    clientId,
    hasSecret: Boolean(secret),
    apiBase: apiBaseFor(env),
    source,
    webhookId,
  };
}

/** Env-only snapshot (synchronous) — useful before any DB round-trip. */
export function envPaypalConfig(): PaypalConfig {  const env: PaypalEnv =
    (process.env.PAYPAL_ENV as PaypalEnv | undefined) === "live"
      ? "live"
      : "sandbox";
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null;
  const secret = process.env.PAYPAL_CLIENT_SECRET || null;
  return {
    enabled: Boolean(clientId && secret),
    env,
    clientId,
    hasSecret: Boolean(secret),
    apiBase: apiBaseFor(env),
    source: clientId && secret ? "env" : "none",
    webhookId: process.env.PAYPAL_WEBHOOK_ID || null,
  };
}

/* ── OAuth2 access token (cached) ─────────────────────────────────────── */

let cachedToken: { token: string; apiBase: string; expiresAt: number } | null =
  null;

async function getAccessToken(cfg: PaypalConfig): Promise<string> {
  const clientId = cfg.clientId;

  // Prefer env secret, else the DB-stored secret (when config came from DB).
  let effectiveSecret = process.env.PAYPAL_CLIENT_SECRET || null;
  if (!effectiveSecret && cfg.source === "db") {
    const db = createAdminClient();
    const { data } = await db
      .from("payment_gateways")
      .select("secret")
      .eq("id", true)
      .maybeSingle();
    effectiveSecret = data?.secret ?? null;
  }

  if (!clientId || !effectiveSecret) {
    throw new Error("PAYPAL_NOT_CONFIGURED");
  }

  const now = Date.now();
  if (
    cachedToken &&
    cachedToken.apiBase === cfg.apiBase &&
    cachedToken.expiresAt > now + 30_000
  ) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${clientId}:${effectiveSecret}`).toString("base64");
  const res = await fetch(`${cfg.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PAYPAL_AUTH_FAILED ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: data.access_token,
    apiBase: cfg.apiBase,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

/* ── Orders API v2 ────────────────────────────────────────────────────── */

export type CreateOrderInput = {
  /** Internal order reference, e.g. MT-A1B2C3D4 */
  orderId: string;
  amount: number;
  currency?: string;
  itemName?: string;
  description?: string;
};

export type CreateOrderResult = {
  id: string; // PayPal order id
  status: string;
  approveLink: string;
};

export async function createPayPalOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const cfg = await resolvePaypalConfig();
  const token = await getAccessToken(cfg);
  const currency = (input.currency || "USD").toUpperCase();
  const amount = Number(input.amount.toFixed(2));

  const itemTotal = amount.toFixed(2);
  const purchaseUnits: Record<string, unknown> = {
    reference_id: input.orderId,
    custom_id: input.orderId,
    invoice_id: input.orderId,
    description: input.description || input.itemName || undefined,
    amount: {
      currency_code: currency,
      value: itemTotal,
      // PayPal requires amount.breakdown.item_total whenever items are present
      // (otherwise orders with an item name fail with 422 ITEM_TOTAL_REQUIRED).
      ...(input.itemName
        ? { breakdown: { item_total: { currency_code: currency, value: itemTotal } } }
        : {}),
    },
  };
  if (input.itemName) {
    purchaseUnits.items = [
      {
        name: input.itemName.slice(0, 127),
        unit_amount: { currency_code: currency, value: itemTotal },
        quantity: "1",
      },
    ];
  }

  const res = await fetch(`${cfg.apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `mt-${input.orderId}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [purchaseUnits],
      application_context: {
        brand_name: "Marwat Tech",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    }),
    cache: "no-store",
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    links?: { rel: string; href: string }[];
    message?: string;
    details?: { issue?: string; description?: string }[];
  };

  if (!res.ok || !data.id) {
    const detail = data.details?.[0];
    throw new Error(
      `PAYPAL_CREATE_FAILED ${res.status} ${data.message ?? ""} ${detail?.issue ?? ""} ${detail?.description ?? ""}`
    );
  }

  const approve =
    data.links?.find((l) => l.rel === "approve")?.href ?? "";
  return { id: data.id, status: data.status ?? "CREATED", approveLink: approve };
}

export type CaptureOrderResult = {
  id: string;
  status: string; // "COMPLETED" on success
  captureId: string | null;
  payerName: string | null;
  payerEmail: string | null;
  grossAmount: number | null;
  currency: string;
};

export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<CaptureOrderResult> {
  const cfg = await resolvePaypalConfig();
  const token = await getAccessToken(cfg);

  const res = await fetch(
    `${cfg.apiBase}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    purchase_units?: {
      captures?: {
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }[];
    }[];
    payer?: {
      name?: { given_name?: string; surname?: string };
      email_address?: string;
    };
  };

  if (!res.ok) {
    throw new Error(`PAYPAL_CAPTURE_FAILED ${res.status} ${data.status ?? ""}`);
  }

  const capture = data.purchase_units?.[0]?.captures?.[0];
  return {
    id: data.id ?? paypalOrderId,
    status: data.status ?? "UNKNOWN",
    captureId: capture?.id ?? null,
    payerName:
      data.payer?.name?.given_name && data.payer?.name?.surname
        ? `${data.payer.name.given_name} ${data.payer.name.surname}`
        : null,
    payerEmail: data.payer?.email_address ?? null,
    grossAmount: capture?.amount?.value ? Number(capture.amount.value) : null,
    currency: capture?.amount?.currency_code ?? "USD",
  };
}

/* ── Shared helpers for other PayPal features (subscriptions, invoicing,
     payouts, disputes, vault, reporting) ─────────────────────────────── */

/** Server-only access token (cached). Throws PAYPAL_NOT_CONFIGURED if unset. */
export async function getPaypalAccessToken(): Promise<string> {
  const cfg = await resolvePaypalConfig();
  return getAccessToken(cfg);
}

/** Resolved API base (sandbox vs live). */
export async function getPaypalApiBase(): Promise<string> {
  return (await resolvePaypalConfig()).apiBase;
}

/** Authed JSON fetch against the PayPal REST API (v1/v2 paths). */
export async function paypalApi<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const base = await getPaypalApiBase();
  const token = await getPaypalAccessToken();
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

/** Resolve the client secret (env or the admin-stored gateway row). */
export async function getPaypalSecret(): Promise<string | null> {
  if (process.env.PAYPAL_CLIENT_SECRET) return process.env.PAYPAL_CLIENT_SECRET;
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("payment_gateways")
      .select("secret")
      .eq("id", true)
      .maybeSingle();
    return data?.secret ?? null;
  } catch {
    return null;
  }
}
