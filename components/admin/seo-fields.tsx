"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadUrlField } from "@/components/admin/upload-url-field";

type SeoPatch = {
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
};

export function SeoFields({
  meta_title,
  meta_description,
  canonical_url,
  og_title,
  og_description,
  og_image,
  onChange,
}: {
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  onChange: (patch: SeoPatch) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">SEO & Social</h2>
      <div className="space-y-2">
        <Label htmlFor="meta_title">Meta title</Label>
        <Input
          id="meta_title"
          value={meta_title}
          onChange={(e) => onChange({ meta_title: e.target.value })}
          placeholder="Custom title tag (optional)"
          maxLength={200}
        />
        <p className="text-right text-xs text-muted-foreground">
          {meta_title.length}/200
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="meta_description">Meta description</Label>
        <Textarea
          id="meta_description"
          rows={3}
          value={meta_description}
          onChange={(e) => onChange({ meta_description: e.target.value })}
          placeholder="Short description shown in search results"
          maxLength={300}
        />
        <p className="text-right text-xs text-muted-foreground">
          {meta_description.length}/300
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="canonical_url">Canonical URL (optional)</Label>
        <Input
          id="canonical_url"
          value={canonical_url}
          onChange={(e) => onChange({ canonical_url: e.target.value })}
          placeholder="https://…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="og_title">Open Graph title</Label>
        <Input
          id="og_title"
          value={og_title}
          onChange={(e) => onChange({ og_title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="og_description">Open Graph description</Label>
        <Textarea
          id="og_description"
          rows={2}
          value={og_description}
          onChange={(e) => onChange({ og_description: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="og_image">Social share image (URL or upload)</Label>
        <UploadUrlField
          id="og_image"
          value={og_image}
          onChange={(v) => onChange({ og_image: v })}
          placeholder="https://…"
        />
      </div>
    </div>
  );
}
