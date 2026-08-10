import { AdminPageHeader } from "@/components/admin/page-header";
import { MediaLibrary } from "@/components/admin/media-library";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminMediaPage() {
  await guardEditor();
  let items: {
    id: string;
    name: string;
    url: string;
    mime_type: string | null;
    size: number | null;
    created_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });
    items = data ?? [];
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Media Library"
        description="Upload and manage images & files (stored in Supabase Storage)."
      />
      <MediaLibrary items={items} />
    </>
  );
}
