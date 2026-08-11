"use client";

import * as React from "react";
import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPayPalCheckout,
  capturePayPalCheckout,
} from "@/lib/actions/payments";
import {
  CURRENCIES,
  PAYMENT_ITEM_TYPES,
  DEFAULT_CURRENCY,
  MIN_AMOUNT,
  MAX_AMOUNT,
  formatMoney,
  type Currency,
  type PaymentItemType,
} from "@/lib/payments/config";

type CheckoutProps = {
  configured: boolean;
  clientId: string | null;
  env: "sandbox" | "live";
  initial?: {
    amount?: number | null;
    currency?: string;
    item?: string;
    type?: string;
    name?: string;
    email?: string;
  };
};

type Status =
  | "idle"
  | "loading"
  | "ready"
  | "processing"
  | "success"
  | "cancelled"
  | "error";

/* ── PayPal SDK loader (injects the official JS SDK) ──────────────────── */

type PayPalButtonsInstance = {
  render: (el: HTMLElement) => Promise<void>;
  close: () => void;
};

type PayPalSdk = {
  Buttons: (options: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }, actions?: unknown) => void | Promise<void>;
    onCancel?: () => void;
    onError?: () => void;
  }) => PayPalButtonsInstance;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

let sdkPromise: { currency: string; promise: Promise<PayPalSdk> } | null = null;

function loadPaypalSdk(clientId: string, currency: string): Promise<PayPalSdk> {
  if (sdkPromise && sdkPromise.currency === currency) {
    return sdkPromise.promise;
  }
  document
    .querySelectorAll("script[data-paypal-sdk]")
    .forEach((s) => s.remove());
  try {
    delete (window as { paypal?: unknown }).paypal;
  } catch {
    /* ignore */
  }

  const promise = new Promise<PayPalSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=${currency}&intent=capture&components=buttons&enable-funding=card`;
    script.setAttribute("data-paypal-sdk", currency);
    script.async = true;
    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal SDK failed to load"));
    };
    script.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.body.appendChild(script);
  });
  sdkPromise = { currency, promise };
  return promise;
}

/* ── Status summary card ──────────────────────────────────────────────── */

function StatusCard({ status, amount, currency }: { status: Status; amount: number; currency: string }) {
  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
            <AppIcon name="check" size={20} />
          </span>
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Payment successful!
            </p>
            <p className="text-sm text-muted-foreground">
              {formatMoney(amount, currency)} received. A confirmation has been
              recorded — we&apos;ll be in touch shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (status === "processing") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <AppIcon name="refresh" size={20} className="animate-spin" />
          </span>
          <div>
            <p className="font-semibold">Confirming your payment…</p>
            <p className="text-sm text-muted-foreground">
              Please don&apos;t close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-400">
        You cancelled the payment. No charge was made — you can try again below.
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        Something went wrong with your payment. Please try again, or contact us
        for help.
      </div>
    );
  }
  return null;
}

/* ── Main component ───────────────────────────────────────────────────── */

export function PaymentCheckout({ configured, clientId, env, initial }: CheckoutProps) {
  const [amount, setAmount] = React.useState<string>(
    initial?.amount ? String(initial.amount) : ""
  );
  const [currency, setCurrency] = React.useState<Currency>(
    (initial?.currency as Currency) || DEFAULT_CURRENCY
  );
  const [itemType, setItemType] = React.useState<PaymentItemType>(
    (initial?.type as PaymentItemType) || "custom"
  );
  const [itemName, setItemName] = React.useState<string>(initial?.item || "");
  const [description, setDescription] = React.useState<string>("");
  const [customerName, setCustomerName] = React.useState<string>(initial?.name || "");
  const [customerEmail, setCustomerEmail] = React.useState<string>(initial?.email || "");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const buttonContainerRef = React.useRef<HTMLDivElement>(null);
  const internalOrderRef = React.useRef("");
  const valuesRef = React.useRef({ amount, currency, itemType, itemName, description, customerName, customerEmail });
  React.useEffect(() => {
    valuesRef.current = { amount, currency, itemType, itemName, description, customerName, customerEmail };
  });

  const amountNum = React.useMemo(() => {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }, [amount]);

  const valid = amountNum !== null && amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;

  /* Render PayPal buttons once SDK loads + amount/currency are valid. */
  React.useEffect(() => {
    if (!configured || !clientId || !amountNum || !buttonContainerRef.current || status === "success") {
      return;
    }
    let cancelled = false;
    let buttons: PayPalButtonsInstance | null = null;

    (async () => {
      try {
        const paypal = await loadPaypalSdk(clientId, currency);
        if (cancelled || !buttonContainerRef.current) return;
        buttonContainerRef.current.innerHTML = "";

        buttons = paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal", height: 48 },
          createOrder: async () => {
            const v = valuesRef.current;
            const res = await createPayPalCheckout({
              amount: Number(v.amount),
              currency: v.currency,
              itemType: v.itemType,
              itemName: v.itemName,
              description: v.description,
              customerName: v.customerName,
              customerEmail: v.customerEmail,
            });
            if (!res.ok) {
              if (res.notConfigured) {
                setError("The payment gateway isn't configured yet. Please contact us.");
              } else {
                setError(res.error || "Could not start payment.");
              }
              throw new Error(res.error || "create failed");
            }
            internalOrderRef.current = res.orderId;
            setError(null);
            return res.paypalOrderId;
          },
          onApprove: async (data: { orderID: string }) => {
            setStatus("processing");
            const res = await capturePayPalCheckout(
              internalOrderRef.current,
              data.orderID
            );
            setStatus(res.ok ? "success" : "error");
          },
          onCancel: () => setStatus("cancelled"),
          onError: () => setStatus("error"),
        });
        await buttons.render(buttonContainerRef.current);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      try {
        buttons?.close?.();
      } catch {
        /* ignore */
      }
    };
  }, [configured, clientId, amountNum, currency, status]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* ── Details form ─────────────────────────────────────── */}
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Payment details</CardTitle>
            <CardDescription>
              Tell us what this payment is for. You&apos;ll pay securely through
              PayPal (cards, PayPal balance, Venmo & Pay Later where available).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="0.01"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>What is this for?</Label>
                <Select value={itemType} onValueChange={(v) => setItemType(v as PaymentItemType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_ITEM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">Item / service name</Label>
                <Input
                  id="item"
                  placeholder="e.g. Web Development — retainer"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes (optional)</Label>
              <Input
                id="description"
                placeholder="Anything we should know?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Summary + PayPal ─────────────────────────────────── */}
      <div className="lg:col-span-2">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="font-display text-xl">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Total due</span>
              <span className="font-display text-2xl font-bold text-primary">
                {amountNum ? formatMoney(amountNum, currency) : formatMoney(0, currency)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AppIcon name="shield" size={15} />
              <span>256-bit encrypted · PCI-compliant · money-back guarantee</span>
            </div>

            {!valid && (
              <p className="text-sm text-muted-foreground">
                Enter an amount between {MIN_AMOUNT} and {MAX_AMOUNT} to continue.
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <StatusCard status={status} amount={amountNum ?? 0} currency={currency} />

            {configured ? (
              <div>
                {valid ? (
                  <>
                    <div
                      ref={buttonContainerRef}
                      className="min-h-[120px] rounded-2xl border border-dashed p-2 [&_iframe]:rounded-xl"
                    />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {env === "sandbox" ? "Sandbox mode — test payments only." : "Secure checkout via PayPal."}
                    </p>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-dashed bg-muted/30 p-5 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <AppIcon name="wallet" size={24} />
                </span>
                <p className="font-semibold">Online payments coming soon</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;re connecting our payment gateway — you&apos;ll be able
                  to pay securely online shortly. In the meantime, reach out and
                  we&apos;ll invoice you directly.
                </p>
                <Button asChild variant="gold" className="w-full">
                  <Link href="/contact">Contact us to arrange payment</Link>
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <AppIcon name="lock" size={13} />
              <span>Marwat Tech · {env === "live" ? "Live" : "Test"} gateway</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
