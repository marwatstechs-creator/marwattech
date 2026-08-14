import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { StudyMaterialForm } from "@/components/admin/forms/study-material-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditStudyMaterialPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let material: {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    category: string | null;
    is_published: boolean;
  } | null = null;

  try {
    const db = await createClient();
    const { data } = await db.from("study_materials").select("*").eq("id", id).single();
    material = data;
  } catch {
    // fallback
  }

  if (!material) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit Study Material"
        description="Update this downloadable resource."
      />
      <StudyMaterialForm initial={material} isEdit />
    </>
  );
}
