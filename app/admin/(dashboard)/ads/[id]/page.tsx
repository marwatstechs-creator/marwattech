import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdForm } from "@/components/admin/forms/ad-form";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditAdPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let ad: {
    id: string;
    name: string;
    ad_client: string;
    slot_id: string | null;
    format: string;
    placement: string;
    enabled: boolean;
    sort_order: number;
  } | null = null;
  let defaultClient = "";

  try {
    const db = await createClient();
    const [{ data: a }, settings] = await Promise.all([
      db.from("ads").select("*").eq("id", id).single(),
      getSiteSettings(db),
    ]);
    ad = a;
    defaultClient = settings.google_adsense_client?.trim() ?? "";
  } catch {
    // fallback
  }

  if (!ad) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit Ad"
        description="Update this AdSense ad unit."
      />
      <AdForm initial={ad} defaultClient={defaultClient} isEdit />
    </>
  );
}
