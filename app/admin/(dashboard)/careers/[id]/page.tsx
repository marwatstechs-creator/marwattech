import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { CareerForm } from "@/components/admin/forms/career-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditCareerPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let item: Record<string, unknown> | null = null;
  try {
    const db = await createClient();
    const { data } = await db.from("careers").select("*").eq("id", id).single();
    item = data;
  } catch {
    // fallback
  }

  if (!item) notFound();

  return (
    <>
      <AdminPageHeader title="Edit Position" description={`Editing “${String(item.title)}”`} />
      <CareerForm
        isEdit
        initial={{
          id: String(item.id),
          title: String(item.title ?? ""),
          slug: String(item.slug ?? ""),
          department: String(item.department ?? ""),
          location: String(item.location ?? ""),
          job_type: String(item.job_type ?? "Full-time"),
          salary_range: String(item.salary_range ?? ""),
          description: String(item.description ?? ""),
          requirements: String(item.requirements ?? ""),
          status: (item.status as "draft" | "published" | "archived") ?? "draft",
        }}
      />
    </>
  );
}
