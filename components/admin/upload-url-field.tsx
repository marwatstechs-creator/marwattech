"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * URL input + Upload button + optional preview — lets any form accept either
 * a pasted URL or a file uploaded straight to the media library, so admins
 * don't have to host images elsewhere.
 */
export function UploadUrlField({
  value,
  onChange,
  placeholder = "https://…",
  id,
  accept = "image/*",
  square = false,
  disabled,
  buttonLabel = "Upload",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  accept?: string;
  square?: boolean;
  disabled?: boolean;
  buttonLabel?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (accept.includes("image") && !file.type.startsWith("image/")) {
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
      toast.success("Uploaded to media library");
    } catch (err) {
      toast.error("Upload failed — check that the media bucket exists and you have permission.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        <input
          ref={fileRef}
          type="file"
          accept={accept}
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
          disabled={uploading || disabled}
          className="shrink-0"
        >
          <AppIcon name={uploading ? "refresh" : "upload"} size={15} />
          {uploading ? "…" : buttonLabel}
        </Button>
      </div>
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className={cn(
              "rounded-lg border object-cover",
              square ? "h-12 w-12 rounded-full" : "h-14 w-24"
            )}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Clear
          </Button>
        </div>
      ) : null}
    </div>
  );
}
