import Link from "next/link";

import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { PaymentsTable, type PaymentRow } from "@/components/admin/payments-table";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/actions/admin/helpers";
import { resolvePaypalConfig } from "@/lib/payments/paypal";
import { formatMoney } from "@/lib/payments/config";
import { isSuperAdmin } from "@/lib/auth";
import { createClient as createDbClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/types/database";

export const revalidate = 0;

export default async function AdminPaymentsPage() {
  const { session } = await requireStaff();
  const cfg = await resolvePaypalConfig();
  const isSuper = session ? isSuperAdmin(session.profile.role) : false;

  let rows: PaymentRow[] = [];
  try {
    const db = await createDbClient();
    const { data } = await db
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    rows = (data ?? []) as unknown as PaymentRow[];
  } catch {
    rows = [];
  }

  const byStatus = (s: PaymentStatus) =>
    rows.filter((r) => r.status === s).length;
  const totalCollected = rows
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <>
      <AdminPageHeader
        title="Payments"
        description="Online (PayPal) and manual payments received."
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
            PayPal is <strong>not configured</strong> yet — customers see a
            &quot;payments coming soon&quot; notice. Add your API keys in Settings
            to go live.
          </p>
          <Button asChild variant="gold" size="sm">
            <Link href="/admin/settings#payments">Configure gateway</Link>
          </Button>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="wallet"
          label="Collected (completed)"
          value={formatMoney(totalCollected, "USD")}
          hint={`${byStatus("completed")} completed`}
        />
        <StatCard
          icon="clock"
          label="Pending"
          value={byStatus("pending")}
          hint="Awaiting payment / capture"
        />
        <StatCard
          icon="refresh"
          label="Refunded"
          value={byStatus("refunded")}
        />
        <StatCard
          icon="dollar"
          label="Total transactions"
          value={rows.length}
          hint={`${byStatus("failed")} failed · ${byStatus("cancelled")} cancelled`}
        />
      </div>

      <PaymentsTable rows={rows} isSuper={isSuper} />
    </>
  );
}
