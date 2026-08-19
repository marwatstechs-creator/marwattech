import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudentGate } from "@/components/client/student-gate";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

export const revalidate = 300;

export default async function ClientMaterialsPage() {
  const session = await getSessionUser();
  const isStudent = session?.profile.role === "student";
  let materials: { id: string; title: string; description: string | null; file_url: string; file_type: string | null; file_size: number | null; category: string | null }[] = [];
  try {
    const db = await createClient();
    const { data } = await db.from("study_materials").select("*").eq("is_published", true).order("created_at", { ascending: false });
    materials = data ?? [];
  } catch { /* fallback */ }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <AdminPageHeader title="Study Materials" description="Download resources, guides and documents." />
      {!isStudent ? (
        <StudentGate />
      ) : materials.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center"><p className="text-muted-foreground">No study materials available yet.</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map(m => (
            <Card key={m.id} className="h-full">
              <CardContent className="flex flex-col gap-3 p-5">
                <span className="icon-3d-tile grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><AppIcon name="file" size={20} /></span>
                <h3 className="font-display font-semibold">{m.title}</h3>
                {m.description && <p className="line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-2">{m.category && <Badge variant="outline">{m.category}</Badge>}{m.file_type && <span>{m.file_type}</span>}<span>{formatSize(m.file_size)}</span></div>
                </div>
                <a href={m.file_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="w-full mt-2"><AppIcon name="download" size={14} />Download</Button></a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
