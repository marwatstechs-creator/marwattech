import { AdminPageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/forms/project-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export default async function NewProjectPage() {
  await guardEditor();
  let clients: { id: string; company: string }[] = [];
  let portalUsers: { id: string; full_name: string | null }[] = [];
  try {
    const db = await createClient();
    const [{ data: c }, { data: users }] = await Promise.all([
      db.from("clients").select("id, company").eq("status", "active").order("company"),
      db.from("profiles").select("id, full_name").eq("role", "client").order("full_name"),
    ]);
    clients = (c ?? []).map((x) => ({ id: x.id, company: x.company }));
    portalUsers = (users ?? []).map((u) => ({ id: u.id, full_name: u.full_name }));
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader title="New Project" description="Add a new client project." />
      <ProjectForm clients={clients} portalUsers={portalUsers} isEdit={false} />
    </>
  );
}
