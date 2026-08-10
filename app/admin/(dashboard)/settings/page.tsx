import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/forms/settings-form";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <>
      <AdminPageHeader
        title="Site Settings"
        description="Global SEO defaults, contact emails and analytics identifiers."
      />
      <SettingsForm initial={settings} />
    </>
  );
}
