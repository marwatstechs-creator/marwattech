import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/forms/client-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditClientPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let client: {
    id: string;
    company: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    notes: string | null;
    status: string;
    user_id: string | null;
  } | null = null;
  let portalUsers: { id: string; full_name: string | null }[] = [];

  try {
    const db = await createClient();
    const [{ data: c }, { data: users }] = await Promise.all([
      db.from("clients").select("*").eq("id", id).single(),
      db.from("profiles").select("id, full_name").eq("role", "client").order("full_name"),
    ]);
    client = c;
    portalUsers = (users ?? []).map((u) => ({ id: u.id, full_name: u.full_name }));
  } catch {
    // fallback
  }

  if (!client) notFound();

  return (
    <>
      <AdminPageHeader title="Edit Client" description={`Editing “${client.company}”`} />
      <ClientForm
        portalUsers={portalUsers}
        isEdit
        initial={{
          id: client.id,
          company: client.company,
          contact_name: client.contact_name ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          website: client.website ?? "",
          address: client.address ?? "",
          notes: client.notes ?? "",
          status: client.status as "active" | "inactive" | "lead",
          user_id: client.user_id ?? "",
        }}
      />
    </>
  );
}
