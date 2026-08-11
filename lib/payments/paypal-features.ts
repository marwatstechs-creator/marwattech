/**
 * PayPal advanced features — subscriptions, invoicing, payouts, disputes,
 * transaction search and Vault (save payment methods).
 *
 * Every function is server-only and throws PAYPAL_NOT_CONFIGURED when keys are
 * missing, so callers can degrade gracefully until the gateway is configured.
 */
import {
  paypalApi,
  resolvePaypalConfig,
} from "@/lib/payments/paypal";

function notConfigured(): never {
  throw new Error("PAYPAL_NOT_CONFIGURED");
}

async function guard(): Promise<void> {
  const cfg = await resolvePaypalConfig();
  if (!cfg.enabled) notConfigured();
}

/* ── Subscriptions (Billing Plans + Subscriptions API) ────────────────── */

export async function createBillingPlan(input: {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  productId?: string;
}) {
  await guard();
  const currency = input.currency.toUpperCase();
  // A catalog product is required to create a billing plan.
  const product = input.productId
    ? { id: input.productId }
    : await createPaypalProduct(input.name);
  const { data } = await paypalApi<{ id?: string; status?: string }>(
    "/v1/billing/plans",
    {
      method: "POST",
      body: {
        product_id: product.id,
        name: input.name.slice(0, 127),
        description: input.description?.slice(0, 255),
        billing_cycles: [
          {
            frequency: {
              interval_unit: input.interval === "month" ? "MONTH" : "YEAR",
              interval_count: 1,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: input.amount.toFixed(2), currency_code: currency },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 3,
        },
      },
    }
  );
  return data;
}

export async function createPaypalProduct(name: string) {
  await guard();
  const { data } = await paypalApi<{ id?: string }>("/v1/catalogs/products", {
    method: "POST",
    body: {
      name: name.slice(0, 127),
      type: "SERVICE",
      category: "SOFTWARE",
    },
  });
  return data;
}

export async function createSubscription(input: {
  planId: string; // PayPal plan id
  name: string;
  email: string;
}) {
  await guard();
  const { data } = await paypalApi<{ id?: string; status?: string; links?: { rel: string; href: string }[] }>(
    "/v1/billing/subscriptions",
    {
      method: "POST",
      body: {
        plan_id: input.planId,
        subscriber: { email_address: input.email, name: { given_name: input.name } },
        application_context: {
          brand_name: "Marwat Tech",
          locale: "en-US",
          user_action: "SUBSCRIBE_NOW",
          payment_method: { payer_selected: "PAYPAL", payee_preferred: "UNRESTRICTED" },
        },
      },
    }
  );
  const approve = data.links?.find((l) => l.rel === "approve")?.href ?? "";
  return { id: data.id, status: data.status, approve };
}

export async function getSubscription(subscriptionId: string) {
  await guard();
  const { data } = await paypalApi<{ status?: string; plan_id?: string; subscriber?: { email_address?: string } }>(
    `/v1/billing/subscriptions/${subscriptionId}`
  );
  return data;
}

/* ── Invoicing API v2 ─────────────────────────────────────────────────── */

export async function createPaypalInvoice(input: {
  invoiceNumber: string;
  clientEmail: string;
  clientName?: string;
  amount: number;
  currency: string;
  dueDate?: string;
  note?: string;
}) {
  await guard();
  const currency = input.currency.toUpperCase();
  const { data } = await paypalApi<{ id?: string; status?: string; href?: string }>(
    "/v2/invoicing/invoices",
    {
      method: "POST",
      body: {
        detail: {
          invoice_number: input.invoiceNumber,
          invoice_date: new Date().toISOString().slice(0, 10),
          ...(input.dueDate ? { payment_term: { due_date: input.dueDate } } : {}),
          ...(input.note ? { note: input.note } : {}),
        },
        invoicer: { name: { given_name: "Marwat", surname: "Tech" } },
        primary_recipients: [
          {
            billing_info: {
              email_address: input.clientEmail,
              ...(input.clientName
                ? { name: { given_name: input.clientName.split(" ")[0], surname: input.clientName.split(" ")[1] ?? "" } }
                : {}),
            },
          },
        ],
        items: [
          {
            name: input.note ?? `Invoice ${input.invoiceNumber}`,
            quantity: "1",
            unit_amount: { currency_code: currency, value: input.amount.toFixed(2) },
          },
        ],
        amount: {
          currency_code: currency,
          value: input.amount.toFixed(2),
          breakdown: {
            item_total: { currency_code: currency, value: input.amount.toFixed(2) },
          },
        },
      },
    }
  );
  return data;
}

export async function sendPaypalInvoice(invoiceId: string) {
  await guard();
  const { ok, data } = await paypalApi<{ error?: string }>(
    `/v2/invoicing/invoices/${invoiceId}/send`,
    { method: "POST", body: { send_to_invoicer: true, send_to_recipient: true } }
  );
  if (!ok) throw new Error(`PAYPAL_INVOICE_SEND_FAILED ${JSON.stringify(data)}`);
  return data;
}

/* ── Payouts (v1 payments/payouts) ────────────────────────────────────── */

export async function createPayout(input: {
  recipientEmail: string;
  amount: number;
  currency: string;
  note?: string;
  senderBatchId: string;
}) {
  await guard();
  const currency = input.currency.toUpperCase();
  const { data } = await paypalApi<{ batch_header?: { payout_batch_id?: string; batch_status?: string } }>(
    "/v1/payments/payouts",
    {
      method: "POST",
      headers: { "PayPal-Request-Id": `mt-payout-${Date.now()}` },
      body: {
        sender_batch_header: {
          sender_batch_id: input.senderBatchId,
          email_subject: "You received a payout from Marwat Tech",
          email_message: input.note ?? "Thank you for working with Marwat Tech.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            receiver: input.recipientEmail,
            amount: { value: input.amount.toFixed(2), currency },
            note: input.note ?? "Marwat Tech payout",
          },
        ],
      },
    }
  );
  return data;
}

/* ── Disputes ─────────────────────────────────────────────────────────── */

export async function listDisputes(params: { state?: string; startDate?: string; pageSize?: number } = {}) {
  await guard();
  const qs = new URLSearchParams();
  if (params.state) qs.set("state", params.state);
  if (params.startDate) qs.set("start_time", params.startDate);
  if (params.pageSize) qs.set("page_size", String(params.pageSize));
  const { data } = await paypalApi<{ items?: unknown[] }>(
    `/v1/customer/disputes${qs.size ? `?${qs}` : ""}`
  );
  return data.items ?? [];
}

export async function getDispute(disputeId: string) {
  await guard();
  const { data } = await paypalApi(`/v1/customer/disputes/${disputeId}`);
  return data;
}

export async function submitDisputeEvidence(disputeId: string, note: string) {
  await guard();
  const { ok, data } = await paypalApi(
    `/v1/customer/disputes/${disputeId}/provide-evidence`,
    {
      method: "POST",
      body: {
        notes: note,
        documents: [],
      },
    }
  );
  if (!ok) throw new Error(`PAYPAL_DISPUTE_EVIDENCE_FAILED ${JSON.stringify(data)}`);
  return data;
}

export async function appealDispute(disputeId: string, note: string) {
  await guard();
  const { ok, data } = await paypalApi(`/v1/customer/disputes/${disputeId}/appeal`, {
    method: "POST",
    body: { notes: note },
  });
  if (!ok) throw new Error(`PAYPAL_DISPUTE_APPEAL_FAILED ${JSON.stringify(data)}`);
  return data;
}

/* ── Transaction search (reporting API) ───────────────────────────────── */

export async function searchTransactions(params: {
  startDate: string; // ISO
  endDate: string; // ISO
  fields?: string;
  pageSize?: number;
}) {
  await guard();
  const qs = new URLSearchParams({
    start_date: params.startDate,
    end_date: params.endDate,
    fields: params.fields ?? "all",
    page_size: String(params.pageSize ?? 50),
  });
  const { data } = await paypalApi<{ transaction_details?: unknown[] }>(
    `/v1/reporting/transactions?${qs}`
  );
  return data.transaction_details ?? [];
}

/* ── Vault (save payment methods) ─────────────────────────────────────── */

export async function createVaultSetupToken() {
  await guard();
  const { data } = await paypalApi<{ id?: string }>("/v1/vault/setup-tokens", {
    method: "POST",
    body: {
      payment_source: { card: { experience_context: { return_url: "https://example.com/return", cancel_url: "https://example.com/cancel" } } },
    },
  });
  return data;
}

export async function createPaymentToken(setupTokenId: string) {
  await guard();
  const { data } = await paypalApi<{ id?: string; payment_source?: { card?: { brand?: string; last_digits?: string }; type?: string } }>(
    "/v1/vault/payment-tokens",
    {
      method: "POST",
      body: { payment_source: { token: { id: setupTokenId, type: "SETUP_TOKEN" } } },
    }
  );
  return data;
}

/** Client token required to render the Vault SDK (save payment methods). */
export async function generateClientToken() {
  await guard();
  const { data } = await paypalApi<{ client_token?: string }>("/v1/identity/generate-token", {
    method: "POST",
  });
  return data;
}
