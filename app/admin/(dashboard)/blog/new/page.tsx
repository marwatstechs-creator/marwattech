import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/forms/post-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export default async function NewPostPage() {
  await guardEditor();
  let categories: { id: string; name: string }[] = [];
  let authors: { id: string; name: string }[] = [];

  try {
    const db = await createClient();
    const [{ data: c }, { data: a }] = await Promise.all([
      db.from("blog_categories").select("id, name").order("name"),
      db
        .from("profiles")
        .select("id, full_name")
        .in("role", ["super_admin", "editor"]),
    ]);
    categories = c ?? [];
    authors = (a ?? []).map((x) => ({ id: x.id, name: x.full_name ?? "Admin" }));
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader title="New Post" description="Start writing a new blog article." />
      <PostForm categories={categories} authors={authors} isEdit={false} />
    </>
  );
}
