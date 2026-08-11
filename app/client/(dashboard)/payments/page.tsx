import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { formatMoney } from "@/lib/payments/config";

export const revalidate = 60;

const STATUS_MAP: Record<string, "default" | "gold" | "outline" | "destructive"> = {
  completed: "default", pending: "outline", failed: "destructive", refunded: "destructive",
};

export default async function ClientPaymentsPage() {
  const session = await getSessionUser();
  const cid = session?.user.id ?? "";
  const email = session?.user.email ?? "";

  let payments: { id: string; amount: number; currency: string; status: string; method: string | null; description: string | null; paid_at: string | null; created_at: string }[] = [];
  let invoices: { id: string; invoice_number: string; amount: number; status: string; due_date: string | null; paid_at: string | null }[] = [];

  try {
    const db = await createClient();
    // Public checkout payments don't set client_id, so match by the email used
    // at checkout too (falling back to client_id for manual/admin-linked rows).
    const orFilter = cid
      ? `client_id.eq.${cid},customer_email.eq.${email}`
      : `customer_email.eq.${email}`;
    const [pay, inv] = await Promise.all([
      db.from("payments").select("*").or(orFilter).order("created_at", { ascending: false }),
      db.from("invoices").select("id, invoice_number, amount, status, due_date, paid_at").eq("client_id", cid).order("created_at", { ascending: false }),
    ]);
    payments = pay.data ?? []; invoices = inv.data ?? [];
  } catch { /* fallback */ }

  // Totals are shown per currency — never sum mixed currencies into one figure.
  const totalByCurrency = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== "completed") continue;
    const cur = (p.currency || "USD").toUpperCase();
    totalByCurrency.set(cur, (totalByCurrency.get(cur) ?? 0) + p.amount);
  }
  const totalSummary = Array.from(totalByCurrency.entries())
    .map(([cur, amt]) => formatMoney(amt, cur))
    .join(" + ");

  return (
    <>
      <AdminPageHeader title="Payments & Invoices" description={`Total paid: ${totalSummary || "—"}`} />
      <div className="space-y-8">
        <div>
          <h2 className="font-display mb-4 text-lg font-bold">Payments</h2>
          {payments.length === 0 ? <div className="rounded-xl border border-dashed bg-muted/40 p-12 text-center"><p className="text-muted-foreground">No payment history yet.</p></div> : (
            <div className="space-y-3">
              {payments.map(p => (
                <Card key={p.id}><CardContent className="flex items-center justify-between p-4"><div><p className="font-medium">{formatMoney(p.amount, p.currency)}</p><p className="text-sm text-muted-foreground">{p.description ?? "Payment"} · {p.method ?? "—"}</p></div><div className="text-right"><Badge variant={STATUS_MAP[p.status] ?? "outline"}>{p.status}</Badge><p className="mt-1 text-xs text-muted-foreground">{p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}</p></div></CardContent></Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="font-display mb-4 text-lg font-bold">Invoices</h2>
          {invoices.length === 0 ? <div className="rounded-xl border border-dashed bg-muted/40 p-12 text-center"><p className="text-muted-foreground">No invoices yet.</p></div> : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <Card key={inv.id}><CardContent className="flex items-center justify-between p-4"><div><p className="font-medium">Invoice #{inv.invoice_number}</p><p className="text-sm text-muted-foreground">${inv.amount} · Due {inv.due_date ? formatDate(inv.due_date) : "—"}</p></div><div className="text-right"><Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "outline"}>{inv.status}</Badge>{inv.paid_at && <p className="mt-1 text-xs text-muted-foreground">Paid {formatDate(inv.paid_at)}</p>}</div></CardContent></Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
