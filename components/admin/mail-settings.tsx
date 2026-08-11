"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveMailSettings } from "@/lib/actions/mail";
import { sendSmtpTest } from "@/lib/actions/marketing";

export type MailSettingsStatus = {
  configured: boolean;
  provider: "smtp" | "resend";
  fromEmail: string | null;
  stored: {
    host: string | null;
    port: number | null;
    secure: boolean;
    user: string | null;
    hasPass: boolean;
    from_email: string | null;
  } | null;
};

export function MailSettings({ status }: { status: MailSettingsStatus }) {
  const [host, setHost] = React.useState(status.stored?.host ?? "");
  const [port, setPort] = React.useState(String(status.stored?.port ?? 465));
  const [secure, setSecure] = React.useState(status.stored?.secure ?? true);
  const [user, setUser] = React.useState(status.stored?.user ?? "");
  const [pass, setPass] = React.useState("");
  const [fromEmail, setFromEmail] = React.useState(status.stored?.from_email ?? status.fromEmail ?? "");
  const [clearPass, setClearPass] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const submit = async () => {
    setPending(true);
    const res = await saveMailSettings({
      host,
      port: Number(port) || 0,
      secure,
      user,
      pass,
      clearPass,
      fromEmail,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not save");
      return;
    }
    toast.success("Mail settings saved");
    setPass("");
    setClearPass(false);
  };

  const test = async () => {
    setPending(true);
    const res = await sendSmtpTest();
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Test failed");
      return;
    }
    toast.success("Test email sent — check your inbox");
  };

  return (
    <Card id="email" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <AppIcon name="mail" size={20} />
          </span>
          <div>
            <CardTitle className="font-display text-lg">Email / SMTP</CardTitle>
            <CardDescription>
              Used for marketing campaigns, invoices, receipts &amp; notifications.
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={status.configured ? "default" : "outline"}>
            {status.configured ? "Configured" : "Not configured"}
          </Badge>
          <Badge variant="gold">{status.provider}</Badge>
          {status.configured && status.fromEmail && (
            <Badge variant="secondary">from: {status.fromEmail}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP host *</Label>
            <Input id="smtp-host" placeholder="mail.marwattech.com" value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Port</Label>
              <Input id="smtp-port" type="number" value={port} onChange={(e) => setPort(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Security</Label>
              <button
                type="button"
                onClick={() => setSecure((s) => !s)}
                className="flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-sm"
              >
                {secure ? "SSL / TLS" : "None"}
                <AppIcon name="arrowDown" size={14} className="opacity-60" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtp-user">Username (email) *</Label>
            <Input id="smtp-user" placeholder="no-reply@marwattech.com" value={user} onChange={(e) => setUser(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-pass">Password</Label>
            <Input
              id="smtp-pass"
              type="password"
              placeholder={status.stored?.hasPass ? "•••••••• (saved — leave blank to keep)" : "SMTP password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            {status.stored?.hasPass && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={clearPass} onChange={(e) => setClearPass(e.target.checked)} className="size-3.5" />
                Clear the saved password
              </label>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtp-from">From email (optional)</Label>
          <Input id="smtp-from" placeholder="no-reply@marwattech.com" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Where to find these</p>
          Your hosting/cPanel control panel → <strong>Email Accounts</strong> (or your email provider&apos;s
          SMTP settings). Common values: host <code className="rounded bg-background px-1">mail.yourdomain.com</code>,
          port <code className="rounded bg-background px-1">465</code> (SSL) or{" "}
          <code className="rounded bg-background px-1">587</code> (TLS). An alternative is setting the{" "}
          <code className="rounded bg-background px-1">RESEND_API_KEY</code> env var, which overrides SMTP.
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={test} disabled={pending}>
            <AppIcon name="mail" size={15} /> Send test email
          </Button>
          <Button variant="gold" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save mail settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
