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
import { createClient } from "@/lib/supabase/client";
import {
  createStudyMaterial,
  updateStudyMaterial,
} from "@/lib/actions/admin/study-materials";

type StudyMaterialFormProps = {
  initial?: {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    category: string | null;
    is_published: boolean;
  };
  isEdit?: boolean;
};

export function StudyMaterialForm({ initial, isEdit = false }: StudyMaterialFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    file_url: initial?.file_url ?? "",
    file_type: initial?.file_type ?? "",
    file_size: initial?.file_size != null ? String(initial.file_size) : "",
    category: initial?.category ?? "",
    is_published: initial?.is_published ?? true,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const db = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `materials/${Date.now()}-${safeName}`;
      const { error } = await db.storage
        .from("media")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = db.storage.from("media").getPublicUrl(path);
      setForm((s) => ({
        ...s,
        file_url: data.publicUrl,
        file_type: file.name.split(".").pop()?.toLowerCase() ?? "",
        file_size: String(file.size),
      }));
      toast.success("File uploaded");
    } catch (err) {
      toast.error("Upload failed — check the media bucket exists and you have permission.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const payload = {
      title: form.title,
      description: form.description,
      file_url: form.file_url,
      file_type: form.file_type,
      file_size: form.file_size,
      category: form.category,
      is_published: form.is_published,
    };
    const res = initial
      ? await updateStudyMaterial(initial.id, payload)
      : await createStudyMaterial(payload);
    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(initial ? "Study material updated" : "Study material added");
    router.push("/admin/study-materials");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-bold">Study material</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Next.js 15 Crash Course PDF"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Web Development"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short summary shown on the Study Materials page."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="file_url">File URL</Label>
              <div className="flex gap-2">
                <Input
                  id="file_url"
                  value={form.file_url}
                  onChange={(e) => set("file_url", e.target.value)}
                  placeholder="https://…"
                  required
                />
                <input
                  type="file"
                  className="hidden"
                  id="material-file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("material-file")?.click()}
                  disabled={uploading}
                  className="shrink-0"
                >
                  <AppIcon name={uploading ? "refresh" : "upload"} size={16} />
                  {uploading ? "Uploading…" : "Upload file"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload the PDF / DOC / ZIP to the media library, or paste any public file URL.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file_type">File type</Label>
              <Input
                id="file_type"
                value={form.file_type}
                onChange={(e) => set("file_type", e.target.value)}
                placeholder="pdf, docx, zip…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file_size">File size (bytes)</Label>
              <Input
                id="file_size"
                type="number"
                min={0}
                value={form.file_size}
                onChange={(e) => set("file_size", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
              <div>
                <p className="font-medium">Published</p>
                <p className="text-xs text-muted-foreground">
                  Only published materials appear on the public page.
                </p>
              </div>
              <Switch
                checked={form.is_published}
                onCheckedChange={(v) => set("is_published", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          <AppIcon name="save" size={16} />
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Material"}
        </Button>
      </div>
    </form>
  );
}
