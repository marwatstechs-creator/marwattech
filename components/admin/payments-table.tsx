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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  recordManualPayment,
  updatePaymentStatus,
  deletePayment,
  refundPayment,
} from "@/lib/actions/payments";
import {
  CURRENCIES,
  PAYMENT_ITEM_TYPES,
  formatMoney,
  type Currency,
  type PaymentItemType,
} from "@/lib/payments/config";
import { formatDate } from "@/lib/utils";
import type { PaymentStatus } from "@/types/database";

export type PaymentRow = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  item_type: string | null;
  item_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  payer_email: string | null;
  paypal_order_id: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "gold" | "outline" | "azure" }> = {
  pending: { label: "Pending", variant: "gold" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "secondary" },
  refunded: { label: "Refunded", variant: "azure" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_STYLES[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/* ── Manual payment dialog ────────────────────────────────────────────── */

function RecordManualPaymentDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [itemType, setItemType] = React.useState<PaymentItemType>("custom");
  const [itemName, setItemName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");

  const submit = async () => {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setPending(true);
    const res = await recordManualPayment({
      amount: Math.round(n * 100) / 100,
      currency,
      status: "completed",
      itemType,
      itemName,
      description,
      customerName,
      customerEmail,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not record payment");
      return;
    }
    toast.success("Payment recorded");
    setOpen(false);
    setAmount("");
    setItemName("");
    setDescription("");
    setCustomerName("");
    setCustomerEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <AppIcon name="plus" size={16} />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a manual payment</DialogTitle>
          <DialogDescription>
            Log an offline payment (cash, bank transfer, cheque, etc.) as completed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="m-amount">Amount *</Label>
              <Input
                id="m-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as PaymentItemType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_ITEM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-item">Item / service</Label>
              <Input
                id="m-item"
                placeholder="e.g. SEO retainer"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="m-name">Customer name</Label>
              <Input
                id="m-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-email">Customer email</Label>
              <Input
                id="m-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-desc">Notes</Label>
            <Textarea
              id="m-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Row actions ──────────────────────────────────────────────────────── */

function RowActions({ row, isSuper }: { row: PaymentRow; isSuper: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<
    null | { kind: "refund" } | { kind: "delete" }
  >(null);

  const run = async (
    fn: () => Promise<{ ok?: boolean; error?: string }>,
    success = "Updated"
  ) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) toast.error(res.error || "Action failed");
    else toast.success(success);
  };

  const runConfirmed = async (
    fn: () => Promise<{ ok?: boolean; error?: string }>,
    success: string
  ) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    setConfirmAction(null);
    if (!res.ok) toast.error(res.error || "Action failed");
    else toast.success(success);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={busy}>
            <AppIcon name="settings" size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{row.order_id}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {row.status === "pending" && (
            <>
              <DropdownMenuItem onClick={() => run(() => updatePaymentStatus(row.id, "completed"))}>
                <AppIcon name="check" size={15} /> Mark completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => run(() => updatePaymentStatus(row.id, "cancelled"))}>
                <AppIcon name="close" size={15} /> Cancel payment
              </DropdownMenuItem>
            </>
          )}
          {row.status === "completed" && (
            <DropdownMenuItem
              onClick={() => setConfirmAction({ kind: "refund" })}
              disabled={busy}
            >
              <AppIcon name="refresh" size={15} /> Refund payment
            </DropdownMenuItem>
          )}
          {row.status === "failed" && (
            <DropdownMenuItem onClick={() => run(() => updatePaymentStatus(row.id, "cancelled"))}>
              <AppIcon name="close" size={15} /> Cancel
            </DropdownMenuItem>
          )}
          {isSuper && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmAction({ kind: "delete" })}
                disabled={busy}
              >
                <AppIcon name="delete" size={15} /> Delete record
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.kind === "refund"
                ? "Refund this payment?"
                : "Delete this payment record?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.kind === "refund"
                ? "This issues a real refund through PayPal (when a capture exists) and marks the payment refunded. This cannot be undone."
                : "This permanently removes the payment record and cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction?.kind === "delete" ? "destructive" : "default"}
              disabled={busy}
              onClick={() =>
                confirmAction?.kind === "refund"
                  ? runConfirmed(() => refundPayment(row.id), "Refund initiated")
                  : runConfirmed(() => deletePayment(row.id), "Payment record deleted")
              }
            >
              {busy
                ? "Working…"
                : confirmAction?.kind === "refund"
                  ? "Refund"
                  : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Table ────────────────────────────────────────────────────────────── */

export function PaymentsTable({
  rows,
  isSuper,
}: {
  rows: PaymentRow[];
  isSuper: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <RecordManualPaymentDialog />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-muted-foreground">
                  No payments yet. Once a customer pays online, it will appear here.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-mono text-xs font-medium">{r.order_id}</p>
                    {r.paypal_order_id && (
                      <p className="max-w-[150px] truncate font-mono text-[10px] text-muted-foreground">
                        PP {r.paypal_order_id}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{r.customer_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.customer_email || r.payer_email || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <p className="truncate text-sm">{r.item_name || r.item_type || "Custom"}</p>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(r.amount, r.currency)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions row={r} isSuper={isSuper} />
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
