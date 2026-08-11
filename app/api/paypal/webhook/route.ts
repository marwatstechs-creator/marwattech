import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePaypalConfig, getPaypalAccessToken } from "@/lib/payments/paypal";
import type { Database, Json } from "@/types/database";
type DB = SupabaseClient<Database>;

/**
 * PayPal Webhook endpoint.
 *
 * URL (add to PayPal Dashboard → Notifications → Webhooks → Add Webhook):
 *   https://marwattech-company.marwatstechs.workers.dev/api/paypal/webhook
 *
 * Set the PAYPAL_WEBHOOK_ID (env or payment_gateways.webhook_id) to enable
 * signature verification. In live mode the handler FAILS CLOSED — events are
 * rejected when no webhook id is configured so forged events can't be trusted.
 * Only an explicit sandbox setup may process events without verification.
 *
 * Handles: payments, subscriptions, invoices, disputes, vault tokens,
 * payouts + records every event for audit/replay.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();

  let event: {
    id?: string;
    event_type?: string;
    resource?: Record<string, unknown> & {
      id?: string;
      custom_id?: string;
      dispute_id?: string;
      payout_item_id?: string;
      amount?: { value?: string; currency_code?: string };
    };
  };

  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event_type ?? "UNKNOWN";
  const resource = event.resource ?? {};

  try {
    // 1) Verify signature (fails closed in live).
    const verified = await verifyWebhook(request, raw);
    if (!verified.ok) {
      return NextResponse.json(
        { error: `Signature verification failed: ${verified.reason}` },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // 2) Dedup by PayPal event id — never reprocess a delivered event.
    if (event.id) {
      const { data: existing } = await db
        .from("webhook_events")
        .select("id")
        .eq("event_id", event.id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ received: true });
      }
    }

    // 3) Record every event (audit / replay).
    await db.from("webhook_events").insert({
      event_id: event.id,
      event_type: eventType,
      provider: "paypal",
      payload: JSON.parse(raw) as Json,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    // 4) Dispatch to the matching handler.
    await handleEvent(db, eventType, resource);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      const db = createAdminClient();
      await db.from("webhook_events").insert({
        event_id: event.id,
        event_type: eventType,
        provider: "paypal",
        payload: JSON.parse(raw) as Json,
        processed: false,
        error: message.slice(0, 500),
      });
    } catch {
      /* best-effort logging */
    }
    // Return a non-2xx so PayPal redelivers (reconciliation depends on it).
    return NextResponse.json({ error: message.slice(0, 200) }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/* ── Signature verification ───────────────────────────────────────────── */

async function verifyWebhook(
  request: Request,
  raw: string
): Promise<{ ok: boolean; reason?: string }> {
  const cfg = await resolvePaypalConfig();
  const webhookId = cfg.webhookId;
  if (!webhookId) {
    // Fail closed: without a webhook id we cannot verify the sender, so we
    // must not trust any event. Only an explicit sandbox setup may skip it.
    if (cfg.env !== "sandbox") {
      return { ok: false, reason: "Webhook id not configured" };
    }
    return { ok: true };
  }

  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionTime = request.headers.get("paypal-transmission-time");
  const transmissionSig = request.headers.get("paypal-transmission-sig");
  const certUrl = request.headers.get("paypal-cert-url");
  const authAlgo = request.headers.get("paypal-auth-algo");
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return { ok: false, reason: "Missing transmission headers" };
  }

  const res = await fetch(`${cfg.apiBase}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getPaypalAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(raw),
    }),
  });

  const data = (await res.json()) as { verification_status?: string };
  if (data.verification_status !== "SUCCESS") {
    return { ok: false, reason: `Status ${data.verification_status}` };
  }
  return { ok: true };
}

/* ── Event dispatch ───────────────────────────────────────────────────── */

type WebhookResource = Record<string, unknown> & {
  id?: string;
  custom_id?: string;
  dispute_id?: string;
  payout_item_id?: string;
  status?: string;
  state?: string;
  reason?: string;
  amount?: { value?: string; currency_code?: string };
  payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
  disputed_transactions?: Array<{
    seller_revision_amount?: { value?: string; currency_code?: string };
  }>;
  buyer?: { email?: string };
  payment_source?: { type?: string; card?: { brand?: string; last_digits?: string } };
  payout_item?: { transaction_status?: string };
};

async function handleEvent(
  db: DB,
  eventType: string,
  r: WebhookResource
) {
  const amt = (v: unknown) => Number((v as { value?: string })?.value ?? 0);
  const cur = (v: unknown) => (v as { currency_code?: string })?.currency_code ?? "USD";

  switch (eventType) {
    /* ── One-off payments (Orders API v2) ── */
    case "CHECKOUT.ORDER.APPROVED":
    case "CHECKOUT.ORDER.COMPLETED":
      await db
        .from("payments")
        .update({ paypal_order_id: r.id })
        .eq("order_id", r.custom_id ?? "");
      break;

    case "PAYMENT.CAPTURE.COMPLETED":
    case "PAYMENT.SALE.COMPLETED":
      await db
        .from("payments")
        .update({
          status: "completed",
          method: "paypal",
          paid_at: new Date().toISOString(),
          paypal_capture_id: r.id,
          payer_email: r.payer?.email_address ?? null,
        })
        .eq("order_id", r.custom_id ?? "");
      break;

    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.SALE.REFUNDED":
      await db
        .from("payments")
        .update({ status: "refunded" })
        .eq("order_id", r.custom_id ?? "");
      break;

    case "PAYMENT.CAPTURE.DENIED":
    case "PAYMENT.CAPTURE.DECLINED":
    case "PAYMENT.SALE.DENIED":
      await db
        .from("payments")
        .update({ status: "failed" })
        .eq("order_id", r.custom_id ?? "");
      break;

    case "PAYMENT.CAPTURE.PENDING":
    case "PAYMENT.SALE.PENDING":
      await db
        .from("payments")
        .update({ status: "pending" })
        .eq("order_id", r.custom_id ?? "");
      break;

    /* ── Subscriptions ── */
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.CREATED":
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      await db
        .from("paypal_subscriptions")
        .update({ status: mapSubscriptionStatus(eventType) })
        .eq("paypal_subscription_id", r.id ?? "");
      break;
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      await db
        .from("paypal_subscriptions")
        .update({ status: mapSubscriptionStatus(eventType) })
        .eq("paypal_subscription_id", r.id ?? "");
      break;
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      await db
        .from("paypal_subscriptions")
        .update({ status: "suspended" })
        .eq("paypal_subscription_id", r.id ?? "");
      break;

    /* ── Invoices ── */
    case "INVOICING.INVOICE.PAID":
      await db
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("paypal_invoice_id", r.id ?? "");
      break;
    case "INVOICING.INVOICE.CANCELLED":
      await db.from("invoices").update({ status: "cancelled" }).eq("paypal_invoice_id", r.id ?? "");
      break;
    case "INVOICING.INVOICE.REFUNDED":
      await db.from("invoices").update({ status: "refunded" }).eq("paypal_invoice_id", r.id ?? "");
      break;
    case "INVOICING.INVOICE.SENT":
      await db
        .from("invoices")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("paypal_invoice_id", r.id ?? "");
      break;

    /* ── Disputes ── */
    case "CUSTOMER.DISPUTE.CREATED":
    case "CUSTOMER.DISPUTE.UPDATED":
    case "CUSTOMER.DISPUTE.RESOLVED":
    case "RISK.DISPUTE.CREATED":
      await db
        .from("paypal_disputes")
        .upsert(
          {
            dispute_id: r.dispute_id ?? r.id ?? "",
            state: r.status ?? r.state ?? "open",
            reason: (r.reason as string) ?? null,
            amount: amt(r.disputed_transactions?.[0]?.seller_revision_amount ?? r.amount),
            currency: cur(r.disputed_transactions?.[0]?.seller_revision_amount ?? r.amount),
            buyer_email: (r.buyer?.email as string) ?? null,
            status: r.status ?? "open",
          },
          { onConflict: "dispute_id" }
        );
      break;

    /* ── Vault (saved payment methods) ── */
    case "VAULT.PAYMENT-TOKEN.CREATED":
    case "VAULT.PAYMENT-TOKEN.UPDATED":
      await db.from("payment_methods").upsert(
        {
          paypal_payment_token_id: r.id ?? "",
          instrument_type: (r.payment_source?.type as string) ?? null,
          brand: (r.payment_source?.card?.brand as string) ?? null,
          last4: (r.payment_source?.card?.last_digits as string) ?? null,
        },
        { onConflict: "paypal_payment_token_id" }
      );
      break;
    case "VAULT.PAYMENT-TOKEN.DELETED":
      await db
        .from("payment_methods")
        .delete()
        .eq("paypal_payment_token_id", r.id ?? "");
      break;

    /* ── Payouts ── */
    case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
      await db
        .from("payouts")
        .update({ status: "processed", paypal_payout_item_id: r.payout_item_id ?? r.id })
        .eq("paypal_payout_item_id", r.payout_item_id ?? "");
      break;
    case "PAYMENT.PAYOUTS-ITEM.FAILED":
    case "PAYMENT.PAYOUTS-ITEM.BLOCKED":
    case "PAYMENT.PAYOUTS-ITEM.UNCLAIMED":
    case "PAYMENT.PAYOUTS-ITEM.REFUNDED":
      await db
        .from("payouts")
        .update({
          status: "failed",
          error: (r.payout_item?.transaction_status as string) ?? eventType,
        })
        .eq("paypal_payout_item_id", r.payout_item_id ?? "");
      break;
    case "PAYMENT.PAYOUTSBATCH.SUCCESS":
    case "PAYMENT.PAYOUTSBATCH.PROCESSING":
    case "PAYMENT.PAYOUTSBATCH.DENIED":
      // Batch-level events — items are updated individually.
      break;

    /* ── Other events are acknowledged but ignored ── */
    default:
      break;
  }
}

function mapSubscriptionStatus(eventType: string): string {
  switch (eventType) {
    case "BILLING.SUBSCRIPTION.CREATED":
      return "pending";
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      return "active";
    case "BILLING.SUBSCRIPTION.CANCELLED":
      return "cancelled";
    case "BILLING.SUBSCRIPTION.EXPIRED":
      return "expired";
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      return "suspended";
    default:
      return "pending";
  }
}
