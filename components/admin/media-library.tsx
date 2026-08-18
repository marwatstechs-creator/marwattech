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

function MediaThumb({ m }: { m: Media }) {
  const [failed, setFailed] = useState(false);
  const isImage = m.mime_type?.startsWith("image/") ?? false;
  const isVideo = m.mime_type?.startsWith("video/") ?? false;

  if (isImage && !failed) {
    return (
      <Image
        src={m.url}
        alt={m.name}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  // Graceful fallback thumbnail (failed image, video, or any other file)
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/10 via-background to-gold/10">
      <div className="flex flex-col items-center gap-1.5 px-2 text-center text-muted-foreground">
        <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
          {isVideo ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <AppIcon name={isImage ? "image" : "file"} size={20} />
          )}
        </span>
        <span className="w-full truncate text-[10px] font-semibold uppercase tracking-wide">
          {isVideo ? "Video" : isImage ? "Image" : "File"}
        </span>
      </div>
    </div>
  );
}

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
                <MediaThumb m={m} />
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
                    itemId={m.id}
                    onDelete={deleteMedia}
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
