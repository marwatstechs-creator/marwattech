import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/forms/project-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let project: {
    id: string;
    title: string;
    client_id: string | null;
    user_id: string | null;
    description: string | null;
    status: string;
    progress: number;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    currency: string;
  } | null = null;
  let clients: { id: string; company: string }[] = [];
  let portalUsers: { id: string; full_name: string | null }[] = [];

  try {
    const db = await createClient();
    const [{ data: p }, { data: c }, { data: users }] = await Promise.all([
      db.from("client_projects").select("*").eq("id", id).single(),
      db.from("clients").select("id, company").eq("status", "active").order("company"),
      db.from("profiles").select("id, full_name").eq("role", "client").order("full_name"),
    ]);
    project = p;
    clients = (c ?? []).map((x) => ({ id: x.id, company: x.company }));
    portalUsers = (users ?? []).map((u) => ({ id: u.id, full_name: u.full_name }));
  } catch {
    // fallback
  }

  if (!project) notFound();

  return (
    <>
      <AdminPageHeader title="Edit Project" description={`Editing “${project.title}”`} />
      <ProjectForm
        clients={clients}
        portalUsers={portalUsers}
        isEdit
        initial={{
          id: project.id,
          title: project.title,
          client_id: project.client_id ?? "",
          user_id: project.user_id ?? "",
          description: project.description ?? "",
          status: project.status as "planning" | "in_progress" | "review" | "completed" | "on_hold",
          progress: project.progress,
          start_date: project.start_date ?? "",
          end_date: project.end_date ?? "",
          budget: project.budget ?? null,
          currency: project.currency,
        }}
      />
    </>
  );
}
