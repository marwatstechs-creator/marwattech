import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActions } from "@/components/admin/row-actions";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deletePost, togglePostStatus } from "@/lib/actions/admin/posts";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminBlogPage() {
  await guardEditor();
  let posts: {
    id: string;
    title: string;
    slug: string;
    status: string;
    published_at: string | null;
    blog_categories?: { name: string } | null;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("blog_posts")
      .select("id, title, slug, status, published_at, blog_categories(name)")
      .order("updated_at", { ascending: false });
    posts = data ?? [];
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
                  No posts yet — write your first article.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </TableCell>
                  <TableCell>{p.blog_categories?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.published_at ? formatDate(p.published_at) : "—"}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      itemId={p.id}
                      editHref={`/admin/blog/${p.id}`}
                      viewHref={`/blog/${p.slug}`}
                      status={p.status}
                      statusOptions={["draft", "published", "archived"]}
                      onStatusChange={(id, status) => togglePostStatus(id, status as "draft" | "published" | "archived")}
                      onDelete={deletePost}
                      label="post"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
