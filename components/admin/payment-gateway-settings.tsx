"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { savePaymentGateway } from "@/lib/actions/payments";

export type GatewayStatus = {
  configured: boolean;
  env: "sandbox" | "live";
  source: "env" | "db" | "none";
  hasClientId: boolean;
  hasSecret: boolean;
  webhookId: string | null;
  stored: { env: string | null; client_id: string | null; hasSecret: boolean; webhook_id: string | null } | null;
};

export function PaymentGatewaySettings({ status }: { status: GatewayStatus }) {
  const [env, setEnv] = React.useState<"sandbox" | "live">(status.stored?.env === "live" ? "live" : "sandbox");
  const [clientId, setClientId] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [webhookId, setWebhookId] = React.useState(status.stored?.webhook_id ?? status.webhookId ?? "");
  const [clearSecret, setClearSecret] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  // Only resolve the browser origin after mount. Otherwise the server renders
  // "" (falling back to the placeholder) while the client renders the real
  // URL — a React hydration mismatch in the webhook <code> block below.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const webhookUrl =
    mounted && typeof window !== "undefined"
      ? `${window.location.origin}/api/paypal/webhook`
      : "";

  const submit = async () => {
    setPending(true);
    const res = await savePaymentGateway({
      env,
      clientId,
      secret,
      clearSecret,
      webhookId,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not save");
      return;
    }
    toast.success("Payment gateway updated");
    setClientId("");
    setSecret("");
    setClearSecret(false);
  };

  return (
    <Card id="payments" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="icon-3d-tile grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <AppIcon name="wallet" size={20} />
          </span>
          <div>
            <CardTitle className="font-display text-lg">Payment Gateway — PayPal</CardTitle>
            <CardDescription>
              Advanced checkout (PayPal, Venmo, Pay Later & cards). Keys are stored
              safely and only visible to staff.
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={status.configured ? "default" : "outline"}>
            {status.configured ? "Active" : "Not configured"}
          </Badge>
          <Badge variant="gold">{status.env} mode</Badge>
          <Badge variant="secondary">source: {status.source}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={env} onValueChange={(v) => setEnv(v as "sandbox" | "live")}>
              <SelectTrigger className="w-full">
                {/* Deterministic children fix a Radix SSR hydration mismatch. */}
                <SelectValue placeholder="Environment">
                  {env === "live" ? "Live (production)" : "Sandbox (test)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (test)</SelectItem>
                <SelectItem value="live">Live (production)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gw-client">PayPal Client ID</Label>
            <Input
              id="gw-client"
              placeholder="e.g. AdOj0...kXmA"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gw-secret">PayPal Client Secret</Label>
          <Input
            id="gw-secret"
            type="password"
            placeholder={status.hasSecret ? "•••••••• (a secret is already saved — leave blank to keep)" : "e.g. EOGx...yD2"}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          {status.hasSecret && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearSecret}
                onChange={(e) => setClearSecret(e.target.checked)}
                className="size-3.5"
              />
              Remove the currently saved secret (disables the gateway)
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gw-webhook">PayPal Webhook ID (optional)</Label>
          <Input
            id="gw-webhook"
            placeholder="e.g. 1FH...WE"
            value={webhookId}
            onChange={(e) => setWebhookId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            From your webhook&apos;s details page — enables signature verification.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">How to get your keys</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Create an app at{" "}
              <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noreferrer" className="text-primary underline">
                developer.paypal.com/dashboard/applications
              </a>{" "}
              (sandbox for testing, live once approved).
            </li>
            <li>Copy the <strong>Client ID</strong> and <strong>Secret</strong> into the fields above and save.</li>
            <li>
              For the live gateway, open your app (Live) in the PayPal dashboard and add <strong>both</strong> of
              these under <em>App Settings → Return URLs / JavaScript origins</em> so the buttons work on
              every domain visitors use:
              <code className="mt-1 block rounded-lg border bg-background px-2 py-1 text-[11px]">https://marwattech.com</code>
              <code className="mt-1 block rounded-lg border bg-background px-2 py-1 text-[11px]">https://www.marwattech.com</code>
              Orders are captured server-side, so a webhook is optional — but adding one is recommended so
              payments still reconcile even if a customer closes the tab mid-payment.
            </li>
          </ol>
        </div>

        {/* Webhook */}
        <div className="rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Webhooks (for payments, subscriptions, invoices, disputes &amp; vault)</p>
          <p className="mb-2">
            In PayPal Dashboard → Notifications → Webhooks, add this URL and subscribe to the events
            you enabled:
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border bg-background px-2 py-1.5 text-[11px]">
              {webhookUrl || "https://YOUR-SITE/api/paypal/webhook"}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              toast.success("Webhook URL copied");
            }}>
              <AppIcon name="copy" size={13} /> Copy
            </Button>
          </div>
          <p className="mt-2">
            Then set the <code className="rounded bg-background px-1">PAYPAL_WEBHOOK_ID</code> env var
            (from the webhook details page) so events are signature-verified.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={submit} disabled={pending} variant="gold">
            {pending ? "Saving…" : "Save gateway keys"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
