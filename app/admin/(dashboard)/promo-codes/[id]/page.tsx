import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PromoCodeForm } from "@/components/admin/forms/promo-code-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditPromoCodePage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let code: {
    id: string;
    title: string;
    store: string;
    code: string;
    discount_label: string | null;
    url: string;
    image_url: string | null;
    category: string | null;
    tag: string;
    expires_at: string | null;
    enabled: boolean;
    sort_order: number;
  } | null = null;

  try {
    const db = await createClient();
    const { data } = await db.from("promo_codes").select("*").eq("id", id).single();
    code = data;
  } catch {
    // fallback
  }

  if (!code) notFound();

  return (
    <>
      <AdminPageHeader title="Edit Promo Code" description="Update this promo code." />
      <PromoCodeForm initial={code} isEdit />
    </>
  );
}
