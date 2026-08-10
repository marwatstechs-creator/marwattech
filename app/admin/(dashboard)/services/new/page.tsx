import { AdminPageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/forms/service-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export default async function NewServicePage() {
  await guardEditor();
  let categories: { id: string; name: string }[] = [];
  try {
    const db = await createClient();
    const { data } = await db
      .from("service_categories")
      .select("id, name")
      .order("sort_order");
    categories = data ?? [];
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="New Service"
        description="Add a new service page to your website."
      />
      <ServiceForm categories={categories} isEdit={false} />
    </>
  );
}
