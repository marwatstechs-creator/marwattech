import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { TestimonialForm } from "@/components/admin/forms/testimonial-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditTestimonialPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let item: Record<string, unknown> | null = null;
  try {
    const db = await createClient();
    const { data } = await db.from("testimonials").select("*").eq("id", id).single();
    item = data;
  } catch {
    // fallback
  }

  if (!item) notFound();

  return (
    <>
      <AdminPageHeader title="Edit Testimonial" description={`Editing “${String(item.client_name)}”`} />
      <TestimonialForm
        isEdit
        initial={{
          id: String(item.id),
          client_name: String(item.client_name ?? ""),
          company: String(item.company ?? ""),
          role: String(item.role ?? ""),
          quote: String(item.quote ?? ""),
          rating: Number(item.rating ?? 5),
          avatar_url: String(item.avatar_url ?? ""),
          featured: Boolean(item.featured),
          status: (item.status as "published" | "draft" | "archived") ?? "published",
          sort_order: Number(item.sort_order ?? 0),
        }}
      />
    </>
  );
}
