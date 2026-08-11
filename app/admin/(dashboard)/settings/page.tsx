import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/forms/settings-form";
import { PaymentGatewaySettings, type GatewayStatus } from "@/components/admin/payment-gateway-settings";
import { MailSettings, type MailSettingsStatus } from "@/components/admin/mail-settings";
import { GoogleSettings, type GoogleSettingsStatus } from "@/components/admin/google-settings";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePaypalConfig } from "@/lib/payments/paypal";
import { resolveMailConfig } from "@/lib/email";
import { resolveGoogleConfig } from "@/lib/google";
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
    webhookId: null,
    stored: null,
  };
  try {
    const cfg = await resolvePaypalConfig();
    const admin = createAdminClient();
    const { data } = await admin
      .from("payment_gateways")
      .select("env, client_id, secret, webhook_id")
      .eq("id", true)
      .maybeSingle();
    gateway = {
      configured: cfg.enabled,
      env: cfg.env,
      source: cfg.source,
      hasClientId: Boolean(cfg.clientId),
      hasSecret: cfg.hasSecret,
      webhookId: cfg.webhookId,
      stored: data
        ? {
            env: data.env,
            client_id: data.client_id,
            hasSecret: Boolean(data.secret),
            webhook_id: data.webhook_id,
          }
        : null,
    };
  } catch {
    // fallback to defaults
  }

  let mail: MailSettingsStatus = {
    configured: false,
    provider: "smtp",
    fromEmail: null,
    stored: null,
  };
  try {
    const cfg = await resolveMailConfig();
    const admin = createAdminClient();
    const { data } = await admin
      .from("mail_settings")
      .select("host, port, secure, user, pass, from_email")
      .eq("id", true)
      .maybeSingle();
    mail = {
      configured: cfg.configured,
      provider: cfg.provider,
      fromEmail: cfg.fromEmail,
      stored: data
        ? {
            host: data.host,
            port: data.port,
            secure: data.secure,
            user: data.user,
            hasPass: Boolean(data.pass),
            from_email: data.from_email,
          }
        : null,
    };
  } catch {
    // fallback to defaults
  }

  let google: GoogleSettingsStatus = {
    enabled: false,
    oneTapEnabled: false,
    hasClientId: false,
    hasSecret: false,
    source: "none",
    stored: null,
  };
  try {
    const cfg = await resolveGoogleConfig();
    const admin = createAdminClient();
    const { data } = await admin
      .from("google_settings")
      .select("client_id, one_tap_enabled")
      .eq("id", true)
      .maybeSingle();
    google = {
      enabled: cfg.enabled,
      oneTapEnabled: cfg.oneTapEnabled,
      hasClientId: Boolean(cfg.clientId),
      hasSecret: cfg.hasSecret,
      source: cfg.source,
      stored: data
        ? { client_id: data.client_id, one_tap_enabled: data.one_tap_enabled }
        : null,
    };
  } catch {
    // fallback to defaults
  }

  return (
    <>
      <AdminPageHeader
        title="Site Settings"
        description="Global SEO defaults, contact emails, analytics, email (SMTP) and payment gateway."
      />
      <div className="space-y-8">
        <SettingsForm initial={settings} />
        <MailSettings status={mail} />
        <GoogleSettings status={google} />
        <PaymentGatewaySettings status={gateway} />
      </div>
    </>
  );
}
