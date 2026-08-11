"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentsTable, PaymentStatusBadge, type PaymentRow } from "@/components/admin/payments-table";
import {
  createPlan,
  togglePlan,
  subscribeToPlan,
  cancelSubscription,
  createInvoice,
  sendInvoice,
  markInvoicePaid,
  createPayout,
  fetchDisputes,
  submitDisputeEvidence,
  appealDispute,
  searchPaypalTransactions,
} from "@/lib/actions/paypal-features";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/payments/config";
import { formatDate } from "@/lib/utils";

/* ── Types ────────────────────────────────────────────────────────────── */

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  paypal_plan_id: string | null;
  features: unknown;
  active: boolean;
  sort_order: number;
};
export type SubRow = {
  id: string;
  plan_id: string | null;
  paypal_plan_id: string | null;
  paypal_subscription_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  created_at: string;
};
export type InvoiceRow = {
  id: string;
  invoice_number: string;
  client_name: string | null;
  client_email: string | null;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  due_date: string | null;
  paid_at: string | null;
  paypal_invoice_id: string | null;
  created_at: string;
};
export type PayoutRow = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  amount: number;
  currency: string;
  note: string | null;
  status: string;
  paypal_payout_item_id: string | null;
  error: string | null;
  created_at: string;
};
export type MethodRow = {
  id: string;
  customer_email: string | null;
  paypal_payment_token_id: string | null;
  instrument_type: string | null;
  brand: string | null;
  last4: string | null;
  created_at: string;
};
export type DisputeRow = {
  id: string;
  dispute_id: string;
  state: string | null;
  reason: string | null;
  amount: number | null;
  currency: string | null;
  buyer_email: string | null;
  status: string;
  evidence: string | null;
  created_at: string;
};

export type HubData = {
  payments: PaymentRow[];
  plans: PlanRow[];
  subscriptions: SubRow[];
  invoices: InvoiceRow[];
  payouts: PayoutRow[];
  paymentMethods: MethodRow[];
  disputes: DisputeRow[];
};

type Props = {
  data: HubData;
  isSuper: boolean;
  gatewayConfigured: boolean;
  gatewayEnv: string;
};

const statusVariant = (s: string) =>
  s === "completed" || s === "active" || s === "paid" || s === "processed" || s === "sent"
    ? ("default" as const)
    : s === "pending" || s === "draft" || s === "open"
      ? ("gold" as const)
      : s === "failed" || s === "cancelled" || s === "overdue"
        ? ("secondary" as const)
        : ("outline" as const);

function StatusPill({ value }: { value: string }) {
  return <Badge variant={statusVariant(value)}>{value}</Badge>;
}

/* ── Subscriptions tab ───────────────────────────────────────────────── */

function SubscriptionsTab({ data }: { data: HubData }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [interval, setInterval] = React.useState<"month" | "year">("month");
  const [description, setDescription] = React.useState("");
  const [features, setFeatures] = React.useState("");

  const create = async () => {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    if (!name || !slug || !Number.isFinite(n) || n <= 0) {
      toast.error("Fill in name, slug and a valid amount");
      return;
    }
    setPending(true);
    const res = await createPlan({
      name,
      slug,
      description,
      amount: Math.round(n * 100) / 100,
      currency,
      interval,
      features: features.split("\n").map((f) => f.trim()).filter(Boolean),
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not create plan");
      return;
    }
    toast.success("Plan created");
    setOpen(false);
    setName(""); setSlug(""); setAmount(""); setDescription(""); setFeatures("");
  };

  const subscribe = async (plan: PlanRow) => {
    const email = window.prompt("Subscriber email", "");
    if (!email) return;
    const res = await subscribeToPlan({ planId: plan.id, email, name: "Subscriber" });
    if (!res.ok) {
      toast.error(res.error || "Could not start subscription");
      return;
    }
    toast.success("Subscription started — opening PayPal approval…");
    if ("approveUrl" in res && res.approveUrl) {
      window.open(res.approveUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Recurring billing plans. Customers subscribe from{" "}
          <code className="rounded bg-muted px-1">/pricing</code>.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gold"><AppIcon name="plus" size={16} /> New plan</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create subscription plan</DialogTitle>
              <DialogDescription>
                Creates a PayPal billing plan (when the gateway is configured) and lists it on /pricing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Growth Retainer" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="growth-retainer" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="99" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Billing</Label>
                  <Select value={interval} onValueChange={(v) => setInterval(v as "month" | "year")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea rows={3} value={features} onChange={(e) => setFeatures(e.target.value)} placeholder={"Unlimited pages\nPriority support\nFree SSL"} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={pending}>{pending ? "Creating…" : "Create plan"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plans yet. Create your first subscription plan.</p>
        ) : (
          data.plans.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="font-display text-2xl font-bold text-primary">
                    {formatMoney(p.amount, p.currency)}<span className="text-sm font-normal text-muted-foreground">/{p.interval}</span>
                  </p>
                </div>
                <StatusPill value={p.active ? "active" : "draft"} />
              </div>
              {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" variant={p.active ? "outline" : "default"} onClick={() => togglePlan(p.id, !p.active)}>
                  {p.active ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="gold" onClick={() => subscribe(p)}>Subscribe</Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subscriptions */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.subscriptions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No subscriptions yet.</TableCell></TableRow>
            ) : (
              data.subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.customer_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.customer_email}</p>
                  </TableCell>
                  <TableCell className="text-sm">{s.interval}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(s.amount, s.currency)}</TableCell>
                  <TableCell><StatusPill value={s.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {s.status === "active" || s.status === "pending" ? (
                      <Button size="sm" variant="outline" onClick={() => cancelSubscription(s.id)}>Cancel</Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Invoices tab ────────────────────────────────────────────────────── */

function InvoicesTab({ data }: { data: HubData }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [clientName, setClientName] = React.useState("");
  const [clientEmail, setClientEmail] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

  const create = async () => {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    if (!clientEmail || !Number.isFinite(n) || n <= 0) {
      toast.error("Enter a client email and valid amount");
      return;
    }
    setPending(true);
    const res = await createInvoice({
      clientName,
      clientEmail,
      amount: Math.round(n * 100) / 100,
      currency,
      description,
      dueDate: dueDate || undefined,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not create invoice");
      return;
    }
    toast.success(`Invoice ${res.invoiceNumber} created`);
    setOpen(false);
    setClientName(""); setClientEmail(""); setAmount(""); setDescription(""); setDueDate("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="gold"><AppIcon name="plus" size={16} /> New invoice</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create invoice</DialogTitle>
              <DialogDescription>Send a branded invoice by email (and via PayPal when configured).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Client name</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Client email *</Label><Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div className="space-y-2"><Label>Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Description / line item</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={pending}>{pending ? "Creating…" : "Create invoice"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.invoices.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No invoices yet.</TableCell></TableRow>
            ) : (
              data.invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell>
                    <p className="font-medium">{inv.client_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{inv.client_email}</p>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(inv.amount, inv.currency)}</TableCell>
                  <TableCell><StatusPill value={inv.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inv.due_date ? formatDate(inv.due_date) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {inv.status !== "sent" && inv.status !== "paid" && (
                        <Button size="sm" variant="outline" onClick={() => sendInvoice(inv.id)}>Send</Button>
                      )}
                      {inv.status !== "paid" && (
                        <Button size="sm" variant="gold" onClick={() => markInvoicePaid(inv.id)}>Mark paid</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Payouts tab ─────────────────────────────────────────────────────── */

function PayoutsTab({ data, isSuper }: { data: HubData; isSuper: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [note, setNote] = React.useState("");

  const send = async () => {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    if (!email || !Number.isFinite(n) || n <= 0) {
      toast.error("Enter a recipient email and valid amount");
      return;
    }
    setPending(true);
    const res = await createPayout({ recipientEmail: email, recipientName: name, amount: Math.round(n * 100) / 100, currency, note });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not send payout");
      return;
    }
    toast.success("Payout requested");
    setOpen(false);
    setEmail(""); setName(""); setAmount(""); setNote("");
  };

  if (!isSuper) {
    return <p className="text-sm text-muted-foreground">Super admin access is required to send payouts.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="gold"><AppIcon name="plus" size={16} /> Send payout</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send a payout</DialogTitle>
              <DialogDescription>Send money to a PayPal account via the Payouts API.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>PayPal email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Recipient name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={send} disabled={pending}>{pending ? "Sending…" : "Send payout"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.payouts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No payouts yet.</TableCell></TableRow>
            ) : (
              data.payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.recipient_name || p.recipient_email}</p>
                    <p className="text-xs text-muted-foreground">{p.recipient_email}</p>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(p.amount, p.currency)}</TableCell>
                  <TableCell><StatusPill value={p.status} /></TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{p.note || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Disputes tab ────────────────────────────────────────────────────── */

function DisputesTab({ data }: { data: HubData }) {
  const [live, setLive] = React.useState<unknown[]>([]);
  const [note, setNote] = React.useState("");
  const [activeDispute, setActiveDispute] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const refresh = async () => {
    setPending(true);
    const res = await fetchDisputes();
    setPending(false);
    if (res.notConfigured) {
      toast.error("PayPal is not configured yet");
      return;
    }
    setLive(res.disputes);
    toast.success(`Fetched ${res.disputes.length} disputes from PayPal`);
  };

  const submitEvidence = async () => {
    if (!activeDispute || !note.trim()) return;
    setPending(true);
    const res = await submitDisputeEvidence(activeDispute, note);
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not submit evidence");
      return;
    }
    toast.success("Evidence submitted");
    setNote("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Customer disputes — view, provide evidence and appeal (from the PayPal API when configured).
        </p>
        <Button variant="outline" size="sm" onClick={refresh} disabled={pending}>
          <AppIcon name="refresh" size={15} /> Sync disputes
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispute</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.disputes.length === 0 && live.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No disputes. Sync from PayPal to pull the latest.</TableCell></TableRow>
            ) : (
              [...data.disputes.map((d) => ({ id: d.dispute_id, reason: d.reason, amount: d.amount, currency: d.currency, state: d.state, created_at: d.created_at })), ...live].map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{(d as { id: string }).id}</TableCell>
                  <TableCell className="text-sm">{(d as { reason: string | null }).reason || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(Number((d as { amount: number | null }).amount ?? 0), (d as { currency: string | null }).currency ?? "USD")}
                  </TableCell>
                  <TableCell><StatusPill value={(d as { state: string | null }).state ?? "open"} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate((d as { created_at: string }).created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setActiveDispute((d as { id: string }).id)}>Evidence</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {activeDispute && (
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-2 font-semibold">Provide evidence — {activeDispute}</p>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain the case, attach references, timelines, etc." />
          <div className="mt-3 flex gap-2">
            <Button onClick={submitEvidence} disabled={pending}>Submit evidence</Button>
            <Button variant="outline" onClick={() => appealDispute(activeDispute, note)} disabled={pending}>Appeal</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Transactions tab ────────────────────────────────────────────────── */

function TransactionsTab({ data }: { data: HubData }) {
  const [start, setStart] = React.useState(() => new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10));
  const [end, setEnd] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = React.useState<unknown[]>([]);
  const [pending, setPending] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const search = async () => {
    setPending(true);
    const res = await searchPaypalTransactions({ startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString() });
    setPending(false);
    if (res.notConfigured) {
      toast.error("PayPal is not configured yet");
      return;
    }
    setRows(res.transactions);
    toast.success(`${res.transactions.length} transactions found`);
  };

  const localMatches = data.payments.filter(
    (p) =>
      !query ||
      p.order_id.toLowerCase().includes(query.toLowerCase()) ||
      (p.customer_email ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (p.customer_name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <p className="mb-3 text-sm font-semibold">PayPal transaction search</p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Start</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">End</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
          </div>
          <Button variant="gold" onClick={search} disabled={pending}>{pending ? "Searching…" : "Search PayPal"}</Button>
        </div>
        {rows.length > 0 && (
          <div className="mt-4 max-h-72 overflow-auto rounded-lg border">
            <pre className="p-4 text-xs">{JSON.stringify(rows, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="mb-3 text-sm font-semibold">Local payment history</p>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by order id, name or email" className="mb-3" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localMatches.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No matching payments.</TableCell></TableRow>
            ) : (
              localMatches.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.order_id}</TableCell>
                  <TableCell className="text-sm">{p.customer_name || p.customer_email || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(p.amount, p.currency)}</TableCell>
                  <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Payment links tab ───────────────────────────────────────────────── */

function PaymentLinksTab() {
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [item, setItem] = React.useState("");
  const [type, setType] = React.useState("service");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const url = React.useMemo(() => {
    const p = new URLSearchParams();
    if (amount) p.set("amount", amount);
    if (currency) p.set("currency", currency);
    if (item) p.set("item", item);
    p.set("type", type);
    if (name) p.set("name", name);
    if (email) p.set("email", email);
    return `${window.location.origin}/payment?${p.toString()}`;
  }, [amount, currency, item, type, name, email]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Payment link copied");
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <p className="mb-3 text-sm font-semibold">Create a reusable payment link / button</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">Amount</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" /></div>
          <div className="space-y-1"><Label className="text-xs">Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Item / service</Label><Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Web development" /></div>
          <div className="space-y-1"><Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Customer name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Customer email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Input readOnly value={url} className="font-mono text-xs" />
          <Button variant="gold" onClick={copy}><AppIcon name="copy" size={15} /> Copy</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Vault tab ───────────────────────────────────────────────────────── */

function VaultTab({ data }: { data: HubData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Saved payment methods via the PayPal Vault API. Customers can save a card/PayPal
        at checkout for one-tap repeat payments.
      </p>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.paymentMethods.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No saved payment methods yet.</TableCell></TableRow>
            ) : (
              data.paymentMethods.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{m.customer_email || "—"}</TableCell>
                  <TableCell className="text-sm">{m.brand || m.instrument_type || "PayPal"}{m.last4 ? ` •••• ${m.last4}` : ""}</TableCell>
                  <TableCell className="max-w-[180px] truncate font-mono text-xs">{m.paypal_payment_token_id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(m.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Hub ──────────────────────────────────────────────────────────────── */

export function PaymentsHub({ data, isSuper, gatewayConfigured, gatewayEnv }: Props) {
  const byStatus = (s: string) => data.payments.filter((p) => p.status === s).length;
  const totalCollected = data.payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);

  return (
    <Tabs defaultValue="overview">
      <TabsList className="flex-wrap">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="payouts">Payouts</TabsTrigger>
        <TabsTrigger value="disputes">Disputes</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="links">Payment links</TabsTrigger>
        <TabsTrigger value="vault">Saved methods</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewStat label="Collected (completed)" value={formatMoney(totalCollected, "USD")} hint={`${byStatus("completed")} completed`} />
          <OverviewStat label="Pending" value={byStatus("pending")} hint="Awaiting payment" />
          <OverviewStat label="Refunded" value={byStatus("refunded")} />
          <OverviewStat label="Total transactions" value={data.payments.length} hint={`${data.plans.length} plans · ${data.invoices.length} invoices`} />
        </div>
        <PaymentsTable rows={data.payments} isSuper={isSuper} />
        {!gatewayConfigured && (
          <p className="text-xs text-muted-foreground">
            Gateway: <strong>{gatewayEnv}</strong> (not configured — online checkout is disabled until keys are added in Settings).
          </p>
        )}
      </TabsContent>

      <TabsContent value="subscriptions" className="pt-4">
        <SubscriptionsTab data={data} />
      </TabsContent>
      <TabsContent value="invoices" className="pt-4">
        <InvoicesTab data={data} />
      </TabsContent>
      <TabsContent value="payouts" className="pt-4">
        <PayoutsTab data={data} isSuper={isSuper} />
      </TabsContent>
      <TabsContent value="disputes" className="pt-4">
        <DisputesTab data={data} />
      </TabsContent>
      <TabsContent value="transactions" className="pt-4">
        <TransactionsTab data={data} />
      </TabsContent>
      <TabsContent value="links" className="pt-4">
        <PaymentLinksTab />
      </TabsContent>
      <TabsContent value="vault" className="pt-4">
        <VaultTab data={data} />
      </TabsContent>
    </Tabs>
  );
}

function OverviewStat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
