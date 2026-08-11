import { AdminPageHeader } from "@/components/admin/page-header";
import { MarketingAdmin, type SubscriberRow, type CampaignRow } from "@/components/admin/marketing-admin";
import { requireStaff } from "@/lib/actions/admin/helpers";
import { isEmailConfigured } from "@/lib/email";
import { createClient as createDbClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminMarketingPage() {
  await requireStaff();

  let subscribers: SubscriberRow[] = [];
  let campaigns: CampaignRow[] = [];

  try {
    const db = await createDbClient();
    const [subs, camps] = await Promise.all([
      db.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("email_campaigns").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    subscribers = (subs.data ?? []) as SubscriberRow[];
    campaigns = (camps.data ?? []) as CampaignRow[];
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Email Marketing"
        description="Newsletter subscribers and branded email campaigns (SMTP)."
      />
      <MarketingAdmin
        subscribers={subscribers}
        campaigns={campaigns}
        emailConfigured={isEmailConfigured()}
      />
    </>
  );
}
