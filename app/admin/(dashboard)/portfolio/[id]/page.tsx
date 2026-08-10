import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PortfolioForm } from "@/components/admin/forms/portfolio-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditPortfolioPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let item: Record<string, unknown> | null = null;
  let categories: { id: string; name: string }[] = [];

  try {
    const db = await createClient();
    const [{ data: p }, { data: c }] = await Promise.all([
      db.from("portfolio_items").select("*").eq("id", id).single(),
      db.from("portfolio_categories").select("id, name").order("sort_order"),
    ]);
    item = p;
    categories = c ?? [];
  } catch {
    // fallback
  }

  if (!item) notFound();

  return (
    <>
      <AdminPageHeader title="Edit Project" description={`Editing “${String(item.title)}”`} />
      <PortfolioForm
        categories={categories}
        isEdit
        initial={{
          id: String(item.id),
          title: String(item.title ?? ""),
          slug: String(item.slug ?? ""),
          client_name: String(item.client_name ?? ""),
          industry: String(item.industry ?? ""),
          summary: String(item.summary ?? ""),
          content: String(item.content ?? ""),
          cover_image: String(item.cover_image ?? ""),
          project_url: String(item.project_url ?? ""),
          category_id: String(item.category_id ?? ""),
          status: (item.status as "draft" | "published" | "archived") ?? "draft",
          featured: Boolean(item.featured),
          images: (item.images as never) ?? [],
          technologies: (item.technologies as never) ?? [],
          meta_title: String(item.meta_title ?? ""),
          meta_description: String(item.meta_description ?? ""),
          canonical_url: String(item.canonical_url ?? ""),
          og_title: String(item.og_title ?? ""),
          og_description: String(item.og_description ?? ""),
          og_image: String(item.og_image ?? ""),
        }}
      />
    </>
  );
}
