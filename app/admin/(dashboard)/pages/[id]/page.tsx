import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PageForm } from "@/components/admin/forms/page-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await guardEditor();
  const { id } = await params;
  const db = await createClient();
  const { data: page } = await db
    .from("pages")
    .select("id, title, slug, content, status, meta_title, meta_description")
    .eq("id", id)
    .maybeSingle();

  if (!page) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit Page"
        description={`Editing “${page.title}”`}
      />
      <PageForm
        isEdit
        initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          content: page.content,
          status: page.status,
          meta_title: page.meta_title ?? "",
          meta_description: page.meta_description ?? "",
        }}
      />
    </>
  );
}
