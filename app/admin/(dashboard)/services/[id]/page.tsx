import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/forms/service-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditServicePage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let service: {
    id: string;
    title: string;
    slug: string;
    icon: string | null;
    category_id: string | null;
    summary: string | null;
    content: string | null;
    benefits: unknown;
    process: unknown;
    faqs: unknown;
    status: string;
    featured: boolean;
    meta_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
  } | null = null;
  let categories: { id: string; name: string }[] = [];

  try {
    const db = await createClient();
    const [{ data: s }, { data: c }] = await Promise.all([
      db.from("services").select("*").eq("id", id).single(),
      db.from("service_categories").select("id, name").order("sort_order"),
    ]);
    service = s;
    categories = c ?? [];
  } catch {
    // fallback
  }

  if (!service) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit Service"
        description={`Editing “${service.title}”`}
      />
      <ServiceForm
        categories={categories}
        isEdit
        initial={{
          id: service.id,
          title: service.title,
          slug: service.slug,
          icon: service.icon ?? "",
          category_id: service.category_id ?? "",
          summary: service.summary ?? "",
          content: service.content ?? "",
          benefits: service.benefits as never,
          process: service.process as never,
          faqs: service.faqs as never,
          status: service.status as "draft" | "published" | "archived",
          featured: service.featured,
          meta_title: service.meta_title ?? "",
          meta_description: service.meta_description ?? "",
          canonical_url: service.canonical_url ?? "",
          og_title: service.og_title ?? "",
          og_description: service.og_description ?? "",
          og_image: service.og_image ?? "",
        }}
      />
    </>
  );
}
