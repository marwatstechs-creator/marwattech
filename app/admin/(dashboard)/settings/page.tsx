import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/forms/settings-form";
import { PaymentGatewaySettings, type GatewayStatus } from "@/components/admin/payment-gateway-settings";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePaypalConfig } from "@/lib/payments/paypal";
import { guardSuperAdmin } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  await guardSuperAdmin();
  const settings: Record<string, string> = {};

  try {
    const db = await createClient();
    const { data } = await db.from("site_settings").select("key, value");
    for (const row of data ?? []) {
      if (row.value) settings[row.key] = row.value;
    }
  } catch {
    // fallback
  }

  let gateway: GatewayStatus = {
    configured: false,
    env: "sandbox",
    source: "none",
    hasClientId: false,
    hasSecret: false,
    stored: null,
  };
  try {
    const cfg = await resolvePaypalConfig();
    const admin = createAdminClient();
    const { data } = await admin
      .from("payment_gateways")
      .select("env, client_id, secret")
      .eq("id", true)
      .maybeSingle();
    gateway = {
      configured: cfg.enabled,
      env: cfg.env,
      source: cfg.source,
      hasClientId: Boolean(cfg.clientId),
      hasSecret: cfg.hasSecret,
      stored: data
        ? {
            env: data.env,
            client_id: data.client_id,
            hasSecret: Boolean(data.secret),
          }
        : null,
    };
  } catch {
    // fallback to defaults
  }

  return (
    <>
      <AdminPageHeader
        title="Site Settings"
        description="Global SEO defaults, contact emails, analytics and payment gateway."
      />
      <div className="space-y-8">
        <SettingsForm initial={settings} />
        <PaymentGatewaySettings status={gateway} />
      </div>
    </>
  );
}
