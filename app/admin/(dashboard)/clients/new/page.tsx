import { AdminPageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/forms/client-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export default async function NewClientPage() {
  await guardEditor();
  let portalUsers: { id: string; full_name: string | null }[] = [];
  try {
    const db = await createClient();
    const { data } = await db
      .from("profiles")
      .select("id, full_name")
      .eq("role", "client")
      .order("full_name");
    portalUsers = (data ?? []).map((u) => ({ id: u.id, full_name: u.full_name }));
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader title="New Client" description="Add a new client to your CRM." />
      <ClientForm portalUsers={portalUsers} isEdit={false} />
    </>
  );
}
