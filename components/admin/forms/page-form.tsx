"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlugField } from "@/components/admin/slug-field";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { CustomHtmlField } from "@/components/admin/custom-html-field";
import { createPage, updatePage, type PageInput } from "@/lib/actions/admin/pages";

export function PageForm({
  initial,
  isEdit,
}: {
  initial?: Partial<PageInput> & { id?: string };
  isEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    content: initial?.content ?? "",
    content_json: initial?.content_json ?? "",
    custom_html: initial?.custom_html ?? "",
    status: (initial?.status ?? "draft") as "draft" | "published" | "archived",
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Stable editor value — only changes when a different record loads.
  const editorValue = useMemo(
    () => (initial?.content_json as string | undefined) || initial?.content || "",
    [initial]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const payload: PageInput = {
      ...form,
      meta_title: form.meta_title || "",
      meta_description: form.meta_description || "",
    };

    const res = initial?.id
      ? await updatePage(initial.id, payload)
      : await createPage(payload);

    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Page updated" : "Page created");
    router.push("/admin/pages");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Main */}
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
                  placeholder="About Us"
                />
              </div>
              <SlugField id="slug" value={form.slug} onChange={(v) => set("slug", v)} title={form.title} />
              <p className="text-xs text-muted-foreground">
                Public URL: /pages/{form.slug || "your-slug"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Full content</h2>
              <RichTextEditor
                value={editorValue}
                onChange={(json) => set("content_json", json)}
                onHtmlChange={(html) => set("content", html)}
                placeholder="Write the page content…"
                mode="page"
              />
            </CardContent>
          </Card>

          <CustomHtmlField value={form.custom_html ?? ""} onChange={(v) => set("custom_html", v)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Publishing</h2>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">SEO</h2>
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta title</Label>
                <Input
                  id="meta-title"
                  value={form.meta_title ?? ""}
                  onChange={(e) => set("meta_title", e.target.value)}
                  placeholder="About Marwat Tech"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-desc">Meta description</Label>
                <Textarea
                  id="meta-desc"
                  rows={3}
                  value={form.meta_description ?? ""}
                  onChange={(e) => set("meta_description", e.target.value)}
                  placeholder="A short SEO description."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (
            <>
              <AppIcon name="save" size={16} />
              {isEdit ? "Update Page" : "Create Page"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
