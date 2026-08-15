"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveGitHubSettings } from "@/lib/actions/github";

export type GitHubSettingsStatus = {
  enabled: boolean;
  hasClientId: boolean;
  hasSecret: boolean;
  source: "db" | "env" | "none";
  stored: { app_name: string | null; client_id: string | null } | null;
};

function CopyField({ value, label }: { value: string; label: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border bg-background px-2 py-1.5 text-xs">
          {value}
        </code>
        <Button type="button" variant="outline" size="icon" className="size-8 shrink-0" onClick={copy} aria-label="Copy">
          <AppIcon name="copy" size={14} />
        </Button>
      </div>
    </div>
  );
}

const GUIDE_STEPS = [
  { title: "Create the GitHub App", desc: "Go to Settings → Developer settings → GitHub Apps → New GitHub App (you must be signed into @marwatstechs-creator)." },
  { title: "GitHub App name", desc: "e.g. “Marwat Tech Login”. This is what users see when authorizing." },
  { title: "Homepage URL", desc: "Use your site URL — e.g. https://www.marwattech.com" },
  { title: "Redirect URI (IMPORTANT)", desc: "Paste the callback URL shown below (ends in /auth/github/callback). Without this, login will fail." },
  { title: "User authorization", desc: "Turn ON “Request user authorization (OAuth) during installation”. Leave “Expire user authorization tokens” OFF for simpler logins." },
  { title: "Device Flow", desc: "Leave “Enable Device Flow” OFF (not needed)." },
  { title: "Webhook", desc: "Set Active to OFF — we don’t need webhooks for login." },
  { title: "Permissions → Account", desc: "Set “Email addresses” to Read-only AND “Profile” to Read-only — required so we get the user’s email + name." },
  { title: "Installation target", desc: "Choose “Only on this account” (@marwatstechs-creator) so only you can install it." },
  { title: "Create the app", desc: "Click “Create GitHub App”, then copy the “Client ID” and generate + copy the “Client secret” from the app’s General page." },
];

export function GitHubSettings({ status }: { status: GitHubSettingsStatus }) {
  const [appName, setAppName] = React.useState(status.stored?.app_name ?? "");
  const [clientId, setClientId] = React.useState(status.stored?.client_id ?? "");
  const [secret, setSecret] = React.useState("");
  const [clearSecret, setClearSecret] = React.useState(false);
  const [enabled, setEnabled] = React.useState(status.enabled);
  const [pending, setPending] = React.useState(false);
  const [origin, setOrigin] = React.useState("https://your-site.com");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const submit = async () => {
    setPending(true);
    const res = await saveGitHubSettings({
      app_name: appName,
      client_id: clientId,
      client_secret: secret,
      clearSecret,
      enabled,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not save");
      return;
    }
    toast.success("GitHub settings saved");
    setSecret("");
    setClearSecret(false);
  };

  return (
    <Card id="github" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-[#111827] text-white">
            <AppIcon name="github" size={20} />
          </span>
          <div>
            <CardTitle className="font-display text-lg">GitHub Sign-In</CardTitle>
            <CardDescription>
              Sign in with GitHub (GitHub App). Paste your App Client ID &amp; Secret.
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={status.enabled ? "default" : "outline"}>
            {status.enabled ? "Enabled" : "Disabled"}
          </Badge>
          <Badge variant="secondary">source: {status.source}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="github-app-name">App name (optional)</Label>
            <Input
              id="github-app-name"
              placeholder="Marwat Tech Login"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-client-id">Client ID *</Label>
            <Input
              id="github-client-id"
              placeholder="Iv1.xxxxxxxxxxxxxxxx"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="github-secret">Client Secret</Label>
            <Input
              id="github-secret"
              type="password"
              placeholder={status.hasSecret ? "•••••••• (saved — leave blank to keep)" : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
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
                Clear the saved secret
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
          <div>
            <p className="text-sm font-medium">Enable GitHub Sign-In</p>
            <p className="text-xs text-muted-foreground">Shows the “Continue with GitHub” button on login pages.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* ── Setup guide (admin dashboard guide) ── */}
        <div className="rounded-xl border bg-muted/40 p-5">
          <p className="mb-3 flex items-center gap-1.5 font-semibold text-foreground">
            <AppIcon name="settings" size={15} className="text-primary" />
            Step-by-step guide — create your GitHub App
          </p>
          <ol className="space-y-3">
            {GUIDE_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3 text-sm">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="my-4 h-px bg-border" />

          <p className="mb-2 text-xs font-semibold text-foreground">
            In the GitHub App → “Identifying and authorizing users” → Redirect URI, add exactly:
          </p>
          <div className="space-y-3">
            <CopyField label="Redirect URI (callback)" value={`${origin}/auth/github/callback`} />
            <CopyField label="Homepage URL" value={origin} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="gold" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save GitHub settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
