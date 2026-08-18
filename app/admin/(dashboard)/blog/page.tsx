import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deletePost, togglePostStatus } from "@/lib/actions/admin/posts";

export const revalidate = 0;

export default async function AdminBlogPage() {
  await guardEditor();
  let rows: {
    id: string;
    title: string;
    slug: string;
    status: string;
    category: string;
    published_at: string | null;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("blog_posts")
      .select("id, title, slug, status, published_at, blog_categories(name)")
      .order("updated_at", { ascending: false });
    const raw = (data ?? []) as unknown as {
      id: string;
      title: string;
      slug: string;
      status: string;
      published_at: string | null;
      blog_categories?: { name: string } | null;
    }[];
    rows = raw.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      category: p.blog_categories?.name ?? "—",
      published_at: p.published_at,
    }));
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Blog Posts"
        description="Write, edit and publish articles."
        actions={
          <Link href="/admin/blog/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Post
            </Button>
          </Link>
        }
      />

      <AdminTable
        rows={rows}
        columns={[
          { key: "title", header: "Title", type: "title", subKey: "slug", sortable: true },
          { key: "category", header: "Category" },
          { key: "status", header: "Status", type: "status" },
          { key: "published_at", header: "Published", type: "date", sortable: true },
        ]}
        searchKeys={["title", "slug"]}
        searchPlaceholder="Search posts…"
        statusOptions={["draft", "published", "archived"]}
        statusKey="status"
        emptyTitle="No posts yet"
        emptyDescription="Write your first article to get started."
        emptyAction={{ label: "New Post", href: "/admin/blog/new" }}
        actions={{
          editBase: "/admin/blog/",
          viewBase: "/blog/",
          slugKey: "slug",
          statusKey: "status",
          statusOptions: ["draft", "published", "archived"],
          onStatusChange: togglePostStatus as never,
          onDelete: deletePost as never,
          label: "post",
        }}
      />
    </>
  );
}
