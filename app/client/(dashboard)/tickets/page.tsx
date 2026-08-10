import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

const STATUS_MAP: Record<string, "default" | "gold" | "azure" | "outline" | "destructive"> = {
  new: "gold", read: "azure", replied: "default", archived: "outline",
};

export default async function ClientTicketsPage() {
  const session = await getSessionUser();
  const clientEmail = session?.user.email ?? "";

  let tickets: { id: string; subject: string | null; issue_type: string; priority: string; status: string; message: string; created_at: string }[] = [];

  try {
    const db = await createClient();
    const { data } = await db.from("support_tickets").select("*").eq("email", clientEmail).order("created_at", { ascending: false });
    tickets = data ?? [];
  } catch { /* fallback */ }

  return (
    <>
      <AdminPageHeader title="Support Tickets" description="View your submitted support tickets and their status." />
      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
          <p className="text-muted-foreground mb-4">No support tickets yet.</p>
          <a href="/technical-support"><Button variant="outline"><AppIcon name="chat" size={16} />Create a ticket</Button></a>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold">{t.subject ?? "Ticket"}</h3>
                    <Badge variant={STATUS_MAP[t.status] ?? "outline"}>{t.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{t.issue_type}</Badge>
                    <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "gold" : "outline"}>{t.priority}</Badge>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">{t.message}</p>
            </div>
          ))}
          <a href="/technical-support"><Button variant="outline"><AppIcon name="plus" size={16} />New Ticket</Button></a>
        </div>
      )}
    </>
  );
}
