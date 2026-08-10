import { AdminPageHeader } from "@/components/admin/page-header";
import { PortfolioForm } from "@/components/admin/forms/portfolio-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export default async function NewPortfolioPage() {
  await guardEditor();
  let categories: { id: string; name: string }[] = [];
  try {
    const db = await createClient();
    const { data } = await db
      .from("portfolio_categories")
      .select("id, name")
      .order("sort_order");
    categories = data ?? [];
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader title="New Project" description="Add a case study to your portfolio." />
      <PortfolioForm categories={categories} isEdit={false} />
    </>
  );
}
