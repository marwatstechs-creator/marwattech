"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SlugField } from "@/components/admin/slug-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SeoFields } from "@/components/admin/seo-fields";
import { ImageField } from "@/components/admin/image-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPost, updatePost, type PostInput } from "@/lib/actions/admin/posts";

type Option = { id: string; name: string };

export function PostForm({
  initial,
  categories,
  authors,
  isEdit,
}: {
  initial?: Partial<PostInput> & { id?: string; tags?: string[] };
  categories: Option[];
  authors: Option[];
  isEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    cover_image: initial?.cover_image ?? "",
    author_id: initial?.author_id ?? "",
    category_id: initial?.category_id ?? "",
    status: initial?.status ?? "draft",
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
    canonical_url: initial?.canonical_url ?? "",
    og_title: initial?.og_title ?? "",
    og_description: initial?.og_description ?? "",
    og_image: initial?.og_image ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const tagNames = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const payload: PostInput = {
      ...form,
      tags: tagNames,
      author_id: form.author_id || null,
      category_id: form.category_id || null,
      excerpt: form.excerpt || null,
      cover_image: form.cover_image || null,
    } as PostInput;

    const res = initial?.id
      ? await updatePost(initial.id, payload)
      : await createPost(payload);

    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Post updated" : "Post created");
    router.push("/admin/blog");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Basics</h2>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (!initial?.id && !form.slug)
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                  }}
                  placeholder="Article title"
                />
              </div>
              <SlugField id="slug" value={form.slug} onChange={(v) => set("slug", v)} title={form.title} />
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" rows={3} value={form.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary shown on cards & in search results" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Content</h2>
              <RichTextEditor value={form.content ?? ""} onChange={(v) => set("content", v)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Publishing</h2>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Select value={form.author_id || "none"} onValueChange={(v) => set("author_id", v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select author" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {authors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id || "none"} onValueChange={(v) => set("category_id", v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="SEO, Next.js, Tutorial" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Featured image</h2>
              <ImageField label="Cover image" value={form.cover_image ?? ""} onChange={(v) => set("cover_image", v)} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <SeoFields
                meta_title={form.meta_title ?? ""}
                meta_description={form.meta_description ?? ""}
                canonical_url={form.canonical_url ?? ""}
                og_title={form.og_title ?? ""}
                og_description={form.og_description ?? ""}
                og_image={form.og_image ?? ""}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (
            <>
              <AppIcon name="save" size={16} />
              {isEdit ? "Update Post" : "Create Post"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
