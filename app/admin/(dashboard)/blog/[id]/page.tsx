import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/forms/post-form";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  await guardEditor();
  const { id } = await params;

  let post: Record<string, unknown> | null = null;
  let categories: { id: string; name: string }[] = [];
  let authors: { id: string; name: string }[] = [];
  let tagNames: string[] = [];

  try {
    const db = await createClient();
    const [{ data: p }, { data: c }, { data: a }, { data: tags }] =
      await Promise.all([
        db.from("blog_posts").select("*").eq("id", id).single(),
        db.from("blog_categories").select("id, name").order("name"),
        db.from("profiles").select("id, full_name").in("role", ["super_admin", "editor"]),
        db
          .from("post_tags")
          .select("blog_tags(name)")
          .eq("post_id", id),
      ]);
    post = p;
    categories = c ?? [];
    authors = (a ?? []).map((x) => ({ id: x.id, name: x.full_name ?? "Admin" }));
    tagNames = (tags ?? [])
      .map((t) => (t as { blog_tags?: { name?: string } | null }).blog_tags?.name)
      .filter((n): n is string => Boolean(n));
  } catch {
    // fallback
  }

  if (!post) notFound();

  return (
    <>
      <AdminPageHeader title="Edit Post" description={`Editing “${String(post.title)}”`} />
      <PostForm
        categories={categories}
        authors={authors}
        isEdit
        initial={{
          id: String(post.id),
          title: String(post.title ?? ""),
          slug: String(post.slug ?? ""),
          excerpt: String(post.excerpt ?? ""),
          content: String(post.content ?? ""),
          custom_html: String(post.custom_html ?? ""),
          cover_image: String(post.cover_image ?? ""),
          author_id: String(post.author_id ?? ""),
          category_id: String(post.category_id ?? ""),
          status: (post.status as "draft" | "published" | "archived") ?? "draft",
          tags: tagNames,
          meta_title: String(post.meta_title ?? ""),
          meta_description: String(post.meta_description ?? ""),
          canonical_url: String(post.canonical_url ?? ""),
          og_title: String(post.og_title ?? ""),
          og_description: String(post.og_description ?? ""),
          og_image: String(post.og_image ?? ""),
        }}
      />
    </>
  );
}
