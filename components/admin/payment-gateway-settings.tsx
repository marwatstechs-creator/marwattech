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
  stored: { env: string | null; client_id: string | null; hasSecret: boolean } | null;
};

export function PaymentGatewaySettings({ status }: { status: GatewayStatus }) {
  const [env, setEnv] = React.useState<"sandbox" | "live">(status.stored?.env === "live" ? "live" : "sandbox");
  const [clientId, setClientId] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [clearSecret, setClearSecret] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const submit = async () => {
    setPending(true);
    const res = await savePaymentGateway({
      env,
      clientId,
      secret,
      clearSecret,
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
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
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
                <SelectValue placeholder="Environment" />
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
              For the live gateway, add your site URL to the app&apos;s redirect list — no webhook is
              required for our flow (orders are captured server-side).
            </li>
          </ol>
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
