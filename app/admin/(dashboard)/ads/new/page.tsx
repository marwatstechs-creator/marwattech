import { AdminPageHeader } from "@/components/admin/page-header";
import { AdForm } from "@/components/admin/forms/ad-form";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";
import { guardEditor } from "@/lib/auth";

export default async function NewAdPage() {
  await guardEditor();

  let defaultClient = "";
  try {
    const db = await createClient();
    const settings = await getSiteSettings(db);
    defaultClient = settings.google_adsense_client?.trim() ?? "";
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="New Ad"
        description="Create a Google AdSense ad unit for your pages."
      />
      <AdForm defaultClient={defaultClient} isEdit={false} />
    </>
  );
}
