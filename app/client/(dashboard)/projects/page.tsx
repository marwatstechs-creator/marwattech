import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

export const revalidate = 60;

const STATUS_MAP: Record<string, { label: string; variant: "default" | "gold" | "azure" | "outline" }> = {
  planning: { label: "Planning", variant: "outline" },
  in_progress: { label: "In Progress", variant: "gold" },
  review: { label: "Review", variant: "azure" },
  completed: { label: "Completed", variant: "default" },
  on_hold: { label: "On Hold", variant: "outline" },
};

export default async function ClientProjectsPage() {
  const session = await getSessionUser();
  let projects: { id: string; title: string; description: string | null; status: string; progress: number; start_date: string | null; end_date: string | null }[] = [];
  try {
    const db = await createClient();
    const { data } = await db.from("client_projects").select("*").eq("client_id", session?.user.id ?? "").order("created_at", { ascending: false });
    projects = data ?? [];
  } catch { /* fallback */ }

  return (
    <>
      <AdminPageHeader title="My Projects" description="Track the status and progress of your active projects." />
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center"><p className="text-muted-foreground">No projects assigned yet. Your projects will appear here once they&apos;re created.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(p => {
            const s = STATUS_MAP[p.status] ?? { label: p.status, variant: "outline" as const };
            return (
              <Card key={p.id} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div><h3 className="font-display text-lg font-bold">{p.title}</h3>{p.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}</div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-medium">{p.progress}%</span></div>
                    <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} /></div>
                  </div>
                  <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                    {p.start_date && <span>Start: {p.start_date}</span>}
                    {p.end_date && <span>Target: {p.end_date}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
