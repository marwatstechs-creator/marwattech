"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { SlugField } from "@/components/admin/slug-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { JsonEditor } from "@/components/admin/json-editor";
import { SeoFields } from "@/components/admin/seo-fields";
import { ImageField } from "@/components/admin/image-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPortfolioItem,
  updatePortfolioItem,
  type PortfolioInput,
} from "@/lib/actions/admin/portfolio";

type Category = { id: string; name: string };

export function PortfolioForm({
  initial,
  categories,
  isEdit,
}: {
  initial?: Partial<PortfolioInput> & { id?: string };
  categories: Category[];
  isEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [tags, setTags] = useState(
    ((initial?.technologies as string[]) ?? []).join(", ")
  );
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    client_name: initial?.client_name ?? "",
    industry: initial?.industry ?? "",
    summary: initial?.summary ?? "",
    content: initial?.content ?? "",
    cover_image: initial?.cover_image ?? "",
    project_url: initial?.project_url ?? "",
    category_id: initial?.category_id ?? "",
    status: initial?.status ?? "draft",
    featured: initial?.featured ?? false,
    images: (initial?.images as Record<string, string>[] | undefined) ?? [],
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
    const technologies = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: PortfolioInput = {
      ...form,
      technologies,
      images: form.images.map((img) => ({ url: img.url ?? "", alt: img.alt })),
      category_id: form.category_id || null,
      client_name: form.client_name || "",
      industry: form.industry || "",
      summary: form.summary || "",
      project_url: form.project_url || "",
      cover_image: form.cover_image || "",
    } as PortfolioInput;

    const res = initial?.id
      ? await updatePortfolioItem(initial.id, payload)
      : await createPortfolioItem(payload);

    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Project updated" : "Project created");
    router.push("/admin/portfolio");
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
                  placeholder="Project name"
                />
              </div>
              <SlugField id="slug" value={form.slug} onChange={(v) => set("slug", v)} title={form.title} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client name</Label>
                  <Input id="client_name" value={form.client_name ?? ""} onChange={(e) => set("client_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_url">Project URL</Label>
                <Input id="project_url" value={form.project_url ?? ""} onChange={(e) => set("project_url", e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Short summary</Label>
                <Textarea id="summary" rows={3} value={form.summary ?? ""} onChange={(e) => set("summary", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Content</h2>
              <RichTextEditor value={form.content ?? ""} onChange={(v) => set("content", v)} />
              <div className="space-y-2">
                <Label htmlFor="tech">Technologies (comma separated)</Label>
                <Input id="tech" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Next.js, Supabase, Stripe" />
              </div>
              <JsonEditor
                label="Gallery images"
                fields={[{ key: "url", label: "Image URL" }, { key: "alt", label: "Alt text" }]}
                value={form.images}
                onChange={(v) => set("images", v)}
              />
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
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">Show on the homepage</p>
                </div>
                <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Cover image</h2>
              <ImageField label="Cover" value={form.cover_image ?? ""} onChange={(v) => set("cover_image", v)} />
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
              {isEdit ? "Update Project" : "Create Project"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
