"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

export function SlugField({
  value,
  onChange,
  title,
  id,
}: {
  value: string;
  onChange: (slug: string) => void;
  title: string;
  id?: string;
}) {
  const autoGenerate = useCallback(() => {
    if (!value) onChange(slugify(title));
  }, [value, title, onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Slug</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(slugify(e.target.value))}
        onBlur={autoGenerate}
        placeholder="my-page-slug"
      />
      <p className="text-xs text-muted-foreground">
        Auto-generated from the title. URL: /…/{value || "my-page-slug"}
      </p>
    </div>
  );
}
