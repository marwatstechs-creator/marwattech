"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff, requireSuperAdmin, logActivity } from "@/lib/actions/admin/helpers";
import { sendEmail } from "@/lib/email";
import { invoiceEmail } from "@/lib/email/templates";
import { resolvePaypalConfig } from "@/lib/payments/paypal";
import * as pp from "@/lib/payments/paypal-features";
import { generateOrderId } from "@/lib/payments/config";
import { SITE } from "@/lib/constants";

/* ── Subscriptions: plans ─────────────────────────────────────────────── */

export async function createPlan(input: {
  name: string;
  slug: string;
  description?: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}) {
  const { session, db } = await requireStaff();
  const cfg = await resolvePaypalConfig();

  let paypalPlanId: string | null = null;
  if (cfg.enabled) {
    try {
      const plan = await pp.createBillingPlan({
        name: input.name,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        interval: input.interval,
      });
      paypalPlanId = plan.id ?? null;
    } catch {
      // PayPal not reachable — plan stored locally, PayPal plan created later.
    }
  }

  const { data, error } = await db
    .from("subscription_plans")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      amount: input.amount,
      currency: input.currency,
      interval: input.interval,
      paypal_plan_id: paypalPlanId,
      features: input.features,
      active: true,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "plan_create", "subscription_plan", data.id);
  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function togglePlan(id: string, active: boolean) {
  const { db } = await requireStaff();
  const { error } = await db.from("subscription_plans").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/payments");
  return { ok: true };
}

/* ── Subscriptions: subscribe (public, from /pricing) ────────────────── */

export async function subscribeToPlan(input: { planId: string; email: string; name?: string }) {
  const parsed = z.object({ planId: z.string().uuid(), email: z.string().email().max(320), name: z.string().max(200).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid details." };

  const db = createAdminClient();
  const { data: plan } = await db.from("subscription_plans").select("*").eq("id", parsed.data.planId).eq("active", true).single();
  if (!plan) return { ok: false as const, error: "Plan not found." };

  if (!plan.paypal_plan_id) {
    return {
      ok: false as const,
      error: "This plan isn't ready for online payment yet. Contact us to subscribe.",
    };
  }

  try {
    const sub = await pp.createSubscription({
      planId: plan.paypal_plan_id,
      name: parsed.data.name || "Customer",
      email: parsed.data.email,
    });

    await db.from("paypal_subscriptions").insert({
      plan_id: plan.id,
      paypal_plan_id: plan.paypal_plan_id,
      paypal_subscription_id: sub.id ?? null,
      customer_name: parsed.data.name || null,
      customer_email: parsed.data.email,
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      status: sub.status ?? "pending",
    });

    return { ok: true as const, approveUrl: sub.approve, subscriptionId: sub.id };
  } catch (err) {
    const m = err instanceof Error ? err.message : "";
    if (m === "PAYPAL_NOT_CONFIGURED") {
      return { ok: false as const, error: "Online subscriptions are not configured yet." };
    }
    return { ok: false as const, error: "Could not start the subscription. Please try again." };
  }
}

/* ── Subscriptions: admin management ──────────────────────────────────── */

export async function cancelSubscription(id: string) {
  const { session, db } = await requireStaff();
  const { data: sub } = await db.from("paypal_subscriptions").select("paypal_subscription_id").eq("id", id).single();
  if (sub?.paypal_subscription_id) {
    try {
      const cfg = await resolvePaypalConfig();
      if (cfg.enabled) {
        const token = await import("@/lib/payments/paypal").then((m) => m.getPaypalAccessToken());
        await fetch(`${cfg.apiBase}/v1/billing/subscriptions/${sub.paypal_subscription_id}/cancel`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Cancelled by Marwat Tech" }),
        });
      }
    } catch {
      /* ignore API error — still update local */
    }
  }
  const { error } = await db.from("paypal_subscriptions").update({ status: "cancelled" }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "subscription_cancel", "paypal_subscription", id);
  revalidatePath("/admin/payments");
  return { ok: true };
}

/* ── Invoices ─────────────────────────────────────────────────────────── */

export async function createInvoice(input: {
  clientName?: string;
  clientEmail: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
}) {
  const { session, db } = await requireStaff();
  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  const cfg = await resolvePaypalConfig();

  let paypalInvoiceId: string | null = null;
  if (cfg.enabled) {
    try {
      const inv = await pp.createPaypalInvoice({
        invoiceNumber,
        clientEmail: input.clientEmail,
        clientName: input.clientName,
        amount: input.amount,
        currency: input.currency,
        dueDate: input.dueDate,
        note: input.description,
      });
      paypalInvoiceId = inv.id ?? null;
    } catch {
      /* keep internal only */
    }
  }

  const { data, error } = await db
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_name: input.clientName || null,
      client_email: input.clientEmail,
      amount: input.amount,
      currency: input.currency,
      status: "draft",
      description: input.description || null,
      due_date: input.dueDate || null,
      paypal_invoice_id: paypalInvoiceId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "invoice_create", "invoice", data.id, { invoice_number: invoiceNumber });
  revalidatePath("/admin/payments");
  return { ok: true, id: data.id, invoiceNumber };
}

export async function sendInvoice(id: string) {
  const { session, db } = await requireStaff();
  const { data: inv } = await db.from("invoices").select("*").eq("id", id).single();
  if (!inv) return { error: "Invoice not found" };

  // Send to PayPal (if configured + has paypal invoice id).
  if (inv.paypal_invoice_id) {
    try {
      await pp.sendPaypalInvoice(inv.paypal_invoice_id);
    } catch {
      /* ignore — still email the client */
    }
  }

  // Always email the client with the branded invoice template.
  const to = inv.client_email || session.user.email;
  if (!to) return { error: "No client email on this invoice" };
  try {
    await sendEmail({
      to,
      subject: `Invoice ${inv.invoice_number} from ${SITE.name}`,
      html: invoiceEmail({
        invoiceNumber: inv.invoice_number,
        clientName: inv.client_name,
        amount: String(inv.amount),
        currency: inv.currency,
        dueDate: inv.due_date,
        description: inv.description,
      }),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send invoice email" };
  }

  await db.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
  await logActivity(db, session, "invoice_send", "invoice", id);
  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function markInvoicePaid(id: string) {
  const { db } = await requireStaff();
  const { error } = await db.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/payments");
  return { ok: true };
}

/* ── Payouts ──────────────────────────────────────────────────────────── */

export async function createPayout(input: {
  recipientEmail: string;
  recipientName?: string;
  amount: number;
  currency: string;
  note?: string;
}) {
  const { session, db } = await requireSuperAdmin();
  const cfg = await resolvePaypalConfig();

  const { data: row, error } = await db
    .from("payouts")
    .insert({
      recipient_email: input.recipientEmail,
      recipient_name: input.recipientName || null,
      amount: input.amount,
      currency: input.currency,
      note: input.note || null,
      status: "pending",
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (!cfg.enabled) {
    return { error: "PayPal is not configured — payout saved as pending but not sent." };
  }

  try {
    const batch = await pp.createPayout({
      recipientEmail: input.recipientEmail,
      amount: input.amount,
      currency: input.currency,
      note: input.note,
      senderBatchId: generateOrderId(),
    });
    await db.from("payouts").update({ paypal_payout_batch_id: batch.batch_header?.payout_batch_id ?? null }).eq("id", row.id);
  } catch (err) {
    const m = err instanceof Error ? err.message : "";
    if (m === "PAYPAL_NOT_CONFIGURED") {
      return { error: "PayPal is not configured yet." };
    }
    await db.from("payouts").update({ status: "failed", error: m.slice(0, 300) }).eq("id", row.id);
    return { error: "Payout request failed." };
  }

  await logActivity(db, session, "payout_create", "payout", row.id, { to: input.recipientEmail });
  revalidatePath("/admin/payments");
  return { ok: true };
}

/* ── Disputes ─────────────────────────────────────────────────────────── */

export async function fetchDisputes() {
  await requireStaff();
  const cfg = await resolvePaypalConfig();
  if (!cfg.enabled) return { notConfigured: true, disputes: [] as unknown[] };
  try {
    const disputes = await pp.listDisputes({ startDate: new Date(Date.now() - 90 * 864e5).toISOString() });
    return { notConfigured: false, disputes };
  } catch {
    return { notConfigured: false, disputes: [] as unknown[] };
  }
}

export async function submitDisputeEvidence(disputeId: string, note: string) {
  const { session, db } = await requireStaff();
  try {
    await pp.submitDisputeEvidence(disputeId, note);
    const { data } = await db.from("paypal_disputes").select("id").eq("dispute_id", disputeId).maybeSingle();
    if (data) {
      await db.from("paypal_disputes").update({ evidence: note, status: "under_review" }).eq("id", data.id);
    }
    await logActivity(db, session, "dispute_evidence", "paypal_dispute", disputeId);
    return { ok: true };
  } catch (err) {
    const m = err instanceof Error ? err.message : "";
    if (m === "PAYPAL_NOT_CONFIGURED") return { error: "PayPal is not configured yet." };
    return { error: "Could not submit evidence." };
  }
}

export async function appealDispute(disputeId: string, note: string) {
  const { session, db } = await requireStaff();
  try {
    await pp.appealDispute(disputeId, note);
    await logActivity(db, session, "dispute_appeal", "paypal_dispute", disputeId);
    return { ok: true };
  } catch (err) {
    const m = err instanceof Error ? err.message : "";
    if (m === "PAYPAL_NOT_CONFIGURED") return { error: "PayPal is not configured yet." };
    return { error: "Could not appeal the dispute." };
  }
}

/* ── Transactions search ──────────────────────────────────────────────── */

export async function searchPaypalTransactions(input: { startDate: string; endDate: string; pageSize?: number }) {
  await requireStaff();
  const cfg = await resolvePaypalConfig();
  if (!cfg.enabled) return { notConfigured: true, transactions: [] as unknown[] };
  try {
    const tx = await pp.searchTransactions({ startDate: input.startDate, endDate: input.endDate, pageSize: input.pageSize });
    return { notConfigured: false, transactions: tx };
  } catch {
    return { notConfigured: false, transactions: [] as unknown[] };
  }
}

/* ── Vault (save payment methods) ─────────────────────────────────────── */

export async function createVaultSetupTokenAction() {
  await requireStaff();
  const cfg = await resolvePaypalConfig();
  if (!cfg.enabled) return { notConfigured: true };
  try {
    const data = await pp.createVaultSetupToken();
    return { notConfigured: false, setupTokenId: data.id ?? null };
  } catch {
    return { notConfigured: false, setupTokenId: null };
  }
}

export async function savePaymentTokenAction(input: { tokenId: string; customerEmail?: string }) {
  const { db } = await requireStaff();
  try {
    const token = await pp.createPaymentToken(input.tokenId);
    const { error } = await db.from("payment_methods").insert({
      customer_email: input.customerEmail || null,
      paypal_payment_token_id: token.id ?? null,
      instrument_type: token.payment_source?.type ?? null,
      brand: token.payment_source?.card?.brand ?? null,
      last4: token.payment_source?.card?.last_digits ?? null,
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/payments");
    return { ok: true };
  } catch (err) {
    const m = err instanceof Error ? err.message : "";
    if (m === "PAYPAL_NOT_CONFIGURED") return { error: "PayPal is not configured yet." };
    return { error: "Could not save payment method." };
  }
}
