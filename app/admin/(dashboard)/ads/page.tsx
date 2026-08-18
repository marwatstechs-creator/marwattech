import { AdminPageHeader } from "@/components/admin/page-header";
import { AdManager, type AdminAdRow } from "@/components/admin/ad-manager";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminAdsPage() {
  await guardEditor();

  let ads: AdminAdRow[] = [];
  try {
    const db = await createClient();
    const { data } = await db
      .from("ads")
      .select("*")
      .order("sort_order", { ascending: true });
    ads = (data ?? []) as AdminAdRow[];
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="AdSense Ads"
        description="Configure every ad location on the site — paste the AdSense code for each spot."
      />
      <AdManager ads={ads} />
    </>
  );
}
