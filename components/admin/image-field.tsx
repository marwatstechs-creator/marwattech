"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImageField({
  label,
  value,
  onChange,
  aspect = "16/9",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Retry the preview whenever the image URL changes.
  useEffect(() => {
    setFailed(false);
  }, [value]);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const db = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `uploads/${Date.now()}-${safeName}`;
      const { error } = await db.storage
        .from("media")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = db.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error("Upload failed — check that the storage bucket exists and you have permission.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… image URL"
          className="flex-1"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <AppIcon name="upload" size={16} />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {value && (
        <div className="relative overflow-hidden rounded-md border" style={{ aspectRatio: aspect }}>
          {failed ? (
            <div className="grid h-full w-full place-items-center bg-muted/40 text-muted-foreground">
              <AppIcon name="image" size={24} />
            </div>
          ) : (
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              onError={() => setFailed(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
