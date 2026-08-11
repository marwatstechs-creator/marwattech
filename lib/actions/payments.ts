"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff, requireSuperAdmin, logActivity } from "@/lib/actions/admin/helpers";
import {
  createPayPalOrder,
  capturePayPalOrder,
  getOrderVaultToken,
  refundPayPalCapture,
  resolvePaypalConfig,
} from "@/lib/payments/paypal";
import {
  CURRENCIES,
  PAYMENT_ITEM_TYPE_VALUES,
  MIN_AMOUNT,
  MAX_AMOUNT,
  DEFAULT_CURRENCY,
  generateOrderId,
} from "@/lib/payments/config";
import type { PaymentStatus } from "@/types/database";

/* ── Shared validation ────────────────────────────────────────────────── */

const currencyEnum = z.enum(CURRENCIES);

const checkoutSchema = z.object({
  amount: z.number().min(MIN_AMOUNT).max(MAX_AMOUNT),
  currency: currencyEnum.default(DEFAULT_CURRENCY),
  itemType: z.enum(PAYMENT_ITEM_TYPE_VALUES).default("custom"),
  itemName: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  customerName: z.string().max(200).optional().or(z.literal("")),
  customerEmail: z.string().email().max(320).optional().or(z.literal("")),
  // v6 SDK: save the buyer's PayPal method to the vault on successful capture.
  saveMethod: z.boolean().optional().default(false),
  // Digital-wallet orders (Google Pay / Apple Pay) declare their payment source.
  paymentSource: z.enum(["googlepay", "applepay"]).optional(),
});

export type CheckoutResult =
  | { ok: true; orderId: string; paypalOrderId: string; amount: number; currency: string }
  | { ok: false; notConfigured?: boolean; error?: string };

/* ── Public: create a PayPal order (server-side, amount is authoritative) ── */

export async function createPayPalCheckout(
  input: z.infer<typeof checkoutSchema>
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the payment details." };
  }
  const cfg = await resolvePaypalConfig();
  if (!cfg.enabled) {
    return { ok: false, notConfigured: true };
  }

  const { amount, currency, itemType, itemName, description, customerName, customerEmail, saveMethod, paymentSource } =
    parsed.data;

  let origin = "https://www.marwattech.com";
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) origin = `${proto}://${host}`;
  } catch {
    /* keep default */
  }

  try {
    const orderId = generateOrderId();
    const db = createAdminClient();

    // Reserve the internal order row first (status pending).
    const { data: row, error } = await db
      .from("payments")
      .insert({
        order_id: orderId,
        amount,
        currency,
        status: "pending",
        item_type: itemType,
        item_name: itemName || null,
        description: description || null,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
      })
      .select("id")
      .single();

    if (error || !row) {
      return { ok: false, error: "Could not start your order. Please try again." };
    }

    let paypal;
    try {
      paypal = await createPayPalOrder({
        orderId,
        amount,
        currency,
        itemName: itemName || undefined,
        description: description || undefined,
        storeInVault: Boolean(saveMethod),
        returnUrl: `${origin}/payment`,
        cancelUrl: `${origin}/payment`,
        paymentSource,
      });
    } catch (createErr) {
      if (saveMethod) {
        // Vaulting not enabled on the app — fall back to a normal order so the
        // payment still goes through (the method just isn't saved).
        paypal = await createPayPalOrder({
          orderId,
          amount,
          currency,
          itemName: itemName || undefined,
          description: description || undefined,
          storeInVault: false,
          paymentSource,
        });
      } else {
        throw createErr;
      }
    }

    // Store the PayPal order id on the row.
    await db
      .from("payments")
      .update({ paypal_order_id: paypal.id })
      .eq("id", row.id);

    return { ok: true, orderId, paypalOrderId: paypal.id, amount, currency };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "PAYPAL_NOT_CONFIGURED" || message.startsWith("PAYPAL_AUTH_FAILED")) {
      return { ok: false, notConfigured: true };
    }
    return { ok: false, error: "Payment could not be started. Please try again." };
  }
}

/* ── Public: capture an approved PayPal order ─────────────────────────── */

export type CaptureResult =
  | { ok: true; orderId: string; status: "completed"; amount: number; currency: string }
  | { ok: false; error?: string; notConfigured?: boolean };

export async function capturePayPalCheckout(
  internalOrderId: string,
  paypalOrderId: string,
  saveMethod = false
): Promise<CaptureResult> {
  const cfg = await resolvePaypalConfig();
  if (!cfg.enabled) {
    return { ok: false, notConfigured: true };
  }
  const db = createAdminClient();
  try {
    const capture = await capturePayPalOrder(paypalOrderId);

    const { data: row } = await db
      .from("payments")
      .select("id, amount, currency, paypal_order_id")
      .eq("order_id", internalOrderId)
      .single();

    if (!row) return { ok: false, error: "Order not found." };

    // Integrity: the captured order must be the one we created for this row.
    if (row.paypal_order_id && row.paypal_order_id !== paypalOrderId) {
      await db.from("payments").update({ status: "failed" }).eq("id", row.id);
      return { ok: false, error: "Payment verification failed." };
    }

    if (capture.status === "COMPLETED") {
      // Integrity: the amount PayPal captured must match what we reserved.
      const amountMatches =
        capture.grossAmount == null ||
        Math.abs(capture.grossAmount - Number(row.amount)) < 0.01;
      const currencyMatches =
        !capture.currency ||
        capture.currency.toUpperCase() === String(row.currency).toUpperCase();
      if (!amountMatches || !currencyMatches) {
        await db.from("payments").update({ status: "failed" }).eq("id", row.id);
        return { ok: false, error: "Payment amount verification failed." };
      }

      await db
        .from("payments")
        .update({
          status: "completed",
          method: "paypal",
          paid_at: new Date().toISOString(),
          paypal_capture_id: capture.captureId,
          payer_name: capture.payerName,
          payer_email: capture.payerEmail,
          metadata: {
            captured_at: new Date().toISOString(),
            paypal_status: capture.status,
            gross_amount: capture.grossAmount,
            currency: capture.currency,
          },
        })
        .eq("id", row.id);

      // v6 vault-with-purchase: persist the saved payment token.
      if (saveMethod) {
        try {
          const vaultToken =
            capture.vaultToken ?? (await getOrderVaultToken(paypalOrderId));
          if (vaultToken) {
            await db.from("payment_methods").upsert(
              {
                paypal_payment_token_id: vaultToken,
                instrument_type: "paypal",
                brand: null,
                last4: null,
                customer_email: capture.payerEmail ?? null,
              },
              { onConflict: "paypal_payment_token_id" }
            );
          }
        } catch {
          /* best-effort — payment already succeeded */
        }
      }

      return {
        ok: true,
        orderId: internalOrderId,
        status: "completed",
        amount: Number(row.amount),
        currency: row.currency,
      };
    }

    await db.from("payments").update({ status: "failed" }).eq("id", row.id);
    return { ok: false, error: "The payment was not completed." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "PAYPAL_NOT_CONFIGURED" || message.startsWith("PAYPAL_AUTH_FAILED")) {
      return { ok: false, notConfigured: true };
    }
    return { ok: false, error: "We could not confirm your payment. Please contact support." };
  }
}

/* ── Admin: PayPal gateway status (for settings/dashboard) ────────────── */

export async function getPaymentGatewayStatus() {
  await requireStaff();
  const cfg = await resolvePaypalConfig();
  let stored: { env: string | null; client_id: string | null; hasSecret: boolean; webhook_id: string | null } | null = null;
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("payment_gateways")
      .select("env, client_id, secret, webhook_id")
      .eq("id", true)
      .maybeSingle();
    stored = data
      ? {
          env: data.env,
          client_id: data.client_id,
          hasSecret: Boolean(data.secret),
          webhook_id: data.webhook_id,
        }
      : null;
  } catch {
    stored = null;
  }
  return {
    configured: cfg.enabled,
    env: cfg.env,
    source: cfg.source,
    hasClientId: Boolean(cfg.clientId),
    hasSecret: cfg.hasSecret,
    webhookId: cfg.webhookId,
    stored,
  };
}

/* ── Admin: save PayPal gateway keys (add later from Settings) ─────────── */

const gatewaySchema = z.object({
  env: z.enum(["sandbox", "live"]),
  clientId: z.string().max(300).optional().or(z.literal("")),
  secret: z.string().max(300).optional().or(z.literal("")),
  clearSecret: z.boolean().optional(),
  webhookId: z.string().max(300).optional().or(z.literal("")),
});

export async function savePaymentGateway(input: z.infer<typeof gatewaySchema>) {
  const { session, db } = await requireSuperAdmin();
  const parsed = gatewaySchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid gateway details." };

  const patch: {
    env: string;
    client_id?: string | null;
    secret?: string | null;
    webhook_id?: string | null;
  } = { env: parsed.data.env };
  if (parsed.data.clientId) patch.client_id = parsed.data.clientId.trim();
  if (parsed.data.clearSecret) patch.secret = null;
  else if (parsed.data.secret) patch.secret = parsed.data.secret.trim();
  if (parsed.data.webhookId) patch.webhook_id = parsed.data.webhookId.trim();
  else if (input.webhookId === "") patch.webhook_id = null;

  const { data, error } = await db
    .from("payment_gateways")
    .update(patch)
    .eq("id", true)
    .select("env, client_id, secret, webhook_id")
    .single();
  if (error) return { error: error.message };

  await logActivity(db, session, "gateway_update", "payment_gateway", "paypal", {
    env: data.env,
    has_client_id: Boolean(data.client_id),
    has_secret: Boolean(data.secret),
    has_webhook_id: Boolean(data.webhook_id),
  });
  revalidatePath("/admin/settings");
  revalidatePath("/payment");
  return { ok: true };
}

/* ── Admin: record a manual / offline payment ─────────────────────────── */

const manualSchema = z.object({
  amount: z.number().min(MIN_AMOUNT).max(MAX_AMOUNT),
  currency: currencyEnum.default(DEFAULT_CURRENCY),
  status: z.enum(["completed", "pending"]).default("completed"),
  itemType: z.enum(PAYMENT_ITEM_TYPE_VALUES).default("custom"),
  itemName: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  customerName: z.string().max(200).optional().or(z.literal("")),
  customerEmail: z.string().email().max(320).optional().or(z.literal("")),
});

export async function recordManualPayment(input: z.infer<typeof manualSchema>) {
  const { session, db } = await requireStaff();
  const parsed = manualSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid payment details." };

  const { data, error } = await db
    .from("payments")
    .insert({
      order_id: generateOrderId(),
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      status: parsed.data.status,
      item_type: parsed.data.itemType,
      item_name: parsed.data.itemName || null,
      description: parsed.data.description || null,
      customer_name: parsed.data.customerName || null,
      customer_email: parsed.data.customerEmail || null,
      method: "manual",
      paid_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
      metadata: { source: "manual" },
    })
    .select("id, order_id")
    .single();

  if (error) return { error: error.message };
  await logActivity(db, session, "payment_record", "payment", data.id, {
    order_id: data.order_id,
    source: "manual",
  });
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return { ok: true };
}

/* ── Admin: change a payment's status (refund / cancel / complete) ─────── */

const STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["completed", "cancelled", "failed"],
  // "refunded" is intentionally NOT here: refunds must go through
  // refundPayment() so the money is actually returned via PayPal.
  completed: [],
  failed: ["cancelled"],
  cancelled: [],
  refunded: [],
};

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  const { session, db } = await requireStaff();
  if (!(status in STATUS_TRANSITIONS)) return { error: "Invalid status" };

  const { data: current } = await db
    .from("payments")
    .select("status, order_id, metadata")
    .eq("id", id)
    .single();
  if (!current) return { error: "Payment not found" };

  const allowed = STATUS_TRANSITIONS[current.status as PaymentStatus];
  if (!allowed.includes(status)) {
    return { error: `Cannot change ${current.status} → ${status}` };
  }

  // Preserve existing capture metadata (audit trail) instead of wiping it.
  const { error } = await db
    .from("payments")
    .update({
      status,
      metadata: {
        ...((current.metadata as Record<string, unknown>) ?? {}),
        status_changed_by: session.user.email,
        changed_at: new Date().toISOString(),
      },
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logActivity(db, session, "payment_status", "payment", id, {
    from: current.status,
    to: status,
  });
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return { ok: true };
}

/* ── Admin: issue a REAL PayPal refund (money is actually returned) ────── */

export async function refundPayment(id: string) {
  const { session, db } = await requireStaff();

  const { data: current } = await db
    .from("payments")
    .select("status, order_id, paypal_capture_id, amount, currency, metadata")
    .eq("id", id)
    .single();
  if (!current) return { error: "Payment not found" };
  if (current.status !== "completed") {
    return { error: "Only completed payments can be refunded." };
  }

  // Issue the refund through PayPal when we have a capture to refund.
  if (current.paypal_capture_id) {
    try {
      await refundPayPalCapture(
        current.paypal_capture_id,
        Number(current.amount),
        current.currency
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      return { error: `PayPal refund failed: ${message}` };
    }
  } else {
    return {
      error: "No PayPal capture found for this payment — refund it in the PayPal dashboard instead.",
    };
  }

  const { error } = await db
    .from("payments")
    .update({
      status: "refunded",
      metadata: {
        ...((current.metadata as Record<string, unknown>) ?? {}),
        refunded_by: session.user.email,
        refunded_at: new Date().toISOString(),
      },
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logActivity(db, session, "payment_refund", "payment", id, {
    from: current.status,
    to: "refunded",
    order_id: current.order_id,
  });
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return { ok: true };
}

/* ── Admin (super): delete a payment record ────────────────────────────── */

export async function deletePayment(id: string) {
  const { session, db } = await requireSuperAdmin();
  const { error } = await db.from("payments").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "payment_delete", "payment", id);
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return { ok: true };
}
