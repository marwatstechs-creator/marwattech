import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PaymentsHub, type HubData } from "@/components/admin/payments-hub";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/actions/admin/helpers";
import { resolvePaypalConfig } from "@/lib/payments/paypal";
import { isSuperAdmin } from "@/lib/auth";
import { createClient as createDbClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminPaymentsPage() {
  const { session } = await requireStaff();
  const cfg = await resolvePaypalConfig();
  const isSuper = session ? isSuperAdmin(session.profile.role) : false;

  const data: HubData = {
    payments: [],
    plans: [],
    subscriptions: [],
    invoices: [],
    payouts: [],
    paymentMethods: [],
    disputes: [],
  };

  try {
    const db = await createDbClient();
    const [pay, plans, subs, invs, outs, methods, disputes] = await Promise.all([
      db.from("payments").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("subscription_plans").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      db.from("paypal_subscriptions").select("*").order("created_at", { ascending: false }).limit(100),
      db.from("invoices").select("*").order("created_at", { ascending: false }).limit(100),
      db.from("payouts").select("*").order("created_at", { ascending: false }).limit(100),
      db.from("payment_methods").select("*").order("created_at", { ascending: false }).limit(100),
      db.from("paypal_disputes").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    data.payments = (pay.data ?? []) as HubData["payments"];
    data.plans = (plans.data ?? []) as HubData["plans"];
    data.subscriptions = (subs.data ?? []) as HubData["subscriptions"];
    data.invoices = (invs.data ?? []) as HubData["invoices"];
    data.payouts = (outs.data ?? []) as HubData["payouts"];
    data.paymentMethods = (methods.data ?? []) as HubData["paymentMethods"];
    data.disputes = (disputes.data ?? []) as HubData["disputes"];
  } catch {
    // fallback to empty
  }

  return (
    <>
      <AdminPageHeader
        title="Payments"
        description="PayPal online payments, subscriptions, invoicing, payouts, disputes and more."
      />

      {/* Gateway status banner */}
      {cfg.enabled ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          <AppIcon name="wallet" size={18} className="text-emerald-600" />
          <p className="flex-1">
            PayPal gateway is <strong>active</strong> ({cfg.env} mode).
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/settings#payments">Manage keys</Link>
          </Button>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AppIcon name="alert" size={18} className="text-amber-600" />
          <p className="flex-1">
            PayPal is <strong>not configured</strong> — payments, subscriptions,
            invoices &amp; payouts show here but go live once you add keys in
            Settings.
          </p>
          <Button asChild variant="gold" size="sm">
            <Link href="/admin/settings#payments">Configure gateway</Link>
          </Button>
        </div>
      )}

      <PaymentsHub data={data} isSuper={isSuper} gatewayConfigured={cfg.enabled} gatewayEnv={cfg.env} />
    </>
  );
}
