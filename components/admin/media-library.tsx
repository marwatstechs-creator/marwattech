"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMedia } from "@/lib/actions/admin/media";
import { formatDate, formatBytes } from "@/lib/utils";

type Media = {
  id: string;
  name: string;
  url: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

export function MediaLibrary({ items }: { items: Media[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const db = createClient();
      const uploaded = [];
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `uploads/${Date.now()}-${safeName}`;
        const { error } = await db.storage
          .from("media")
          .upload(path, file, { upsert: false, cacheControl: "3600" });
        if (error) throw error;
        const { data } = db.storage.from("media").getPublicUrl(path);
        const { error: dbError } = await db.from("media").insert({
          name: file.name,
          path,
          url: data.publicUrl,
          mime_type: file.type || null,
          size: file.size || null,
        });
        if (dbError) throw dbError;
        uploaded.push(file.name);
      }
      toast.success(`Uploaded ${uploaded.length} file(s)`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed — check that the storage bucket exists and you have permission.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {items.length} file(s) in your media library.
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf,.zip"
          className="hidden"
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = "";
          }}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <AppIcon name="upload" size={16} />
          {uploading ? "Uploading…" : "Upload files"}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-20 text-center">
          <AppIcon name="image" size={40} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No media yet. Upload images to use across your site.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-[4/3] bg-muted/40">
                {m.mime_type?.startsWith("image/") ? (
                  <Image
                    src={m.url}
                    alt={m.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <AppIcon name="file" size={32} className="text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 text-foreground"
                    onClick={async () => {
                      await navigator.clipboard.writeText(m.url);
                      toast.success("URL copied");
                    }}
                  >
                    <AppIcon name="link" size={14} />
                    Copy
                  </Button>
                  <DeleteButton
                    onDelete={() => deleteMedia(m.id)}
                    label="file"
                  />
                </div>
              </div>
              <div className="space-y-0.5 p-3">
                <p className="truncate text-xs font-medium">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {m.size ? formatBytes(m.size) : "—"} · {formatDate(m.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
