"use client";

import { useMemo, useState } from "react";
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
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { JsonEditor } from "@/components/admin/json-editor";
import { SeoFields } from "@/components/admin/seo-fields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createService, updateService, type ServiceInput } from "@/lib/actions/admin/services";
import { ICONS, type IconName } from "@/lib/icons";

type Category = { id: string; name: string };

const ICON_OPTIONS = Object.keys(ICONS) as IconName[];

export function ServiceForm({
  initial,
  categories,
  isEdit,
}: {
  initial?: Partial<ServiceInput> & { id?: string };
  categories: Category[];
  isEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    icon: initial?.icon ?? "code",
    category_id: initial?.category_id ?? "",
    summary: initial?.summary ?? "",
    content: initial?.content ?? "",
    content_json: initial?.content_json ?? "",
    benefits: (initial?.benefits as Record<string, string>[]) ?? [],
    process: (initial?.process as Record<string, string>[]) ?? [],
    faqs: (initial?.faqs as Record<string, string>[]) ?? [],
    status: initial?.status ?? "draft",
    featured: initial?.featured ?? false,
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
    canonical_url: initial?.canonical_url ?? "",
    og_title: initial?.og_title ?? "",
    og_description: initial?.og_description ?? "",
    og_image: initial?.og_image ?? "",
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
    const payload: ServiceInput = {
      ...form,
      category_id: form.category_id || null,
      icon: form.icon || "",
      summary: form.summary || "",
    } as ServiceInput;

    const res = initial?.id
      ? await updateService(initial.id, payload)
      : await createService(payload);

    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Service updated" : "Service created");
    router.push("/admin/services");
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
                    if (!initial?.id && !form.slug) set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                  }}
                  placeholder="Web Development"
                />
              </div>
              <SlugField id="slug" value={form.slug} onChange={(v) => set("slug", v)} title={form.title} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="summary">Short summary</Label>
                  <Textarea id="summary" rows={3} value={form.summary ?? ""} onChange={(e) => set("summary", e.target.value)} placeholder="One or two lines for cards & SEO" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={form.icon ?? "code"} onValueChange={(v) => set("icon", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {ICON_OPTIONS.map((name) => (
                          <SelectItem key={name} value={name}>
                            <span className="flex items-center gap-2">
                              <AppIcon name={name} size={16} />
                              {name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category_id || "none"} onValueChange={(v) => set("category_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Full content</h2>
              <RichTextEditor
                value={editorValue}
                onChange={(json) => set("content_json", json)}
                onHtmlChange={(html) => set("content", html)}
                placeholder="Describe this service…"
                mode="page"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6 p-6">
              <h2 className="font-display text-lg font-bold">Structured sections</h2>
              <JsonEditor
                label="Benefits"
                fields={[{ key: "title", label: "Benefit title" }, { key: "description", label: "Description", textarea: true }]}
                value={form.benefits}
                onChange={(v) => set("benefits", v)}
              />
              <JsonEditor
                label="Process steps"
                fields={[{ key: "step", label: "Step number" }, { key: "title", label: "Title" }, { key: "description", label: "Description", textarea: true }]}
                value={form.process}
                onChange={(v) => set("process", v)}
              />
              <JsonEditor
                label="FAQs"
                fields={[{ key: "question", label: "Question" }, { key: "answer", label: "Answer", textarea: true }]}
                value={form.faqs}
                onChange={(v) => set("faqs", v)}
              />
            </CardContent>
          </Card>
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
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (
            <>
              <AppIcon name="save" size={16} />
              {isEdit ? "Update Service" : "Create Service"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
