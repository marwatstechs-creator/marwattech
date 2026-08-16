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
import { saveGoogleSettings } from "@/lib/actions/google";

export type GoogleSettingsStatus = {
  enabled: boolean;
  oneTapEnabled: boolean;
  hasClientId: boolean;
  hasSecret: boolean;
  source: "db" | "env" | "none";
  stored: { client_id: string | null; one_tap_enabled: boolean } | null;
};

const GUIDE_LINKS = [
  {
    label: "OAuth consent screen",
    url: "https://console.cloud.google.com/apis/credentials/consent",
    hint: "Set the app name + support email (External → create).",
  },
  {
    label: "Create an OAuth Client ID",
    url: "https://console.cloud.google.com/apis/credentials",
    hint: "Application type → Web application.",
  },
  {
    label: "Sign in with Google overview (docs)",
    url: "https://developers.google.com/identity/gsi/web/guides/overview",
    hint: "Official setup + verification guide.",
  },
  {
    label: "Google One Tap guide (docs)",
    url: "https://developers.google.com/identity/gsi/web/guides/display-google-one-tap",
    hint: "How the One Tap prompt works + requirements.",
  },
];

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

export function GoogleSettings({ status }: { status: GoogleSettingsStatus }) {
  const [clientId, setClientId] = React.useState(status.stored?.client_id ?? "");
  const [secret, setSecret] = React.useState("");
  const [clearSecret, setClearSecret] = React.useState(false);
  const [enabled, setEnabled] = React.useState(status.enabled);
  const [oneTap, setOneTap] = React.useState(status.oneTapEnabled);
  const [pending, setPending] = React.useState(false);
  const [origin, setOrigin] = React.useState("https://your-site.com");
  const [oneTapStatus, setOneTapStatus] = React.useState<{
    type: string;
    reason: string | null;
    at: number;
  } | null>(null);

  React.useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const raw = localStorage.getItem("mts_onetap_last");
      if (raw) setOneTapStatus(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const submit = async () => {
    setPending(true);
    const res = await saveGoogleSettings({
      client_id: clientId,
      client_secret: secret,
      clearSecret,
      enabled,
      one_tap_enabled: oneTap,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not save");
      return;
    }
    toast.success("Google settings saved");
    setSecret("");
    setClearSecret(false);
  };

  return (
    <Card id="google" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="icon-3d-tile grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <AppIcon name="google" size={20} />
          </span>
          <div>
            <CardTitle className="font-display text-lg">Google Sign-In</CardTitle>
            <CardDescription>
              Sign in with Google + one-tap login. Just paste your Client ID &amp; Secret.
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={status.enabled ? "default" : "outline"}>
            {status.enabled ? "Enabled" : "Disabled"}
          </Badge>
          <Badge variant={status.oneTapEnabled ? "gold" : "outline"}>
            {status.oneTapEnabled ? "One Tap on" : "One Tap off"}
          </Badge>
          <Badge variant="secondary">source: {status.source}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {oneTapStatus && (
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              <AppIcon
                name={oneTapStatus.type === "displayed" ? "check" : "alert"}
                size={15}
                className={oneTapStatus.type === "displayed" ? "text-emerald-500" : "text-amber-500"}
              />
              <p className="text-sm font-semibold">
                Last One Tap attempt: {oneTapStatus.type}
              </p>
            </div>
            {oneTapStatus.reason && (
              <p className="mt-1 text-xs text-muted-foreground">
                Reason: <code className="rounded bg-background px-1 py-0.5">{oneTapStatus.reason}</code>
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              One Tap is controlled by Google — it only appears for visitors signed into a Google account
              in this browser, and Google/browsers often skip it (FedCM, cookies, frequency limits). The
              regular buttons still work.
            </p>
            {oneTapStatus.reason === "unregistered_origin" && (
              <p className="mt-2 rounded-md border border-amber-400/40 bg-amber-400/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                Fix: add <code className="rounded bg-background/60 px-1">{origin}</code> to the OAuth
                client&apos;s <b>Authorized JavaScript origins</b> in Google Cloud Console, and publish the
                OAuth consent screen (not &quot;Testing&quot; mode).
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="google-client-id">Client ID (OAuth 2.0) *</Label>
            <Input
              id="google-client-id"
              placeholder="1234567890-xxxxxxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google-secret">Client Secret</Label>
            <Input
              id="google-secret"
              type="password"
              placeholder={status.hasSecret ? "•••••••• (saved — leave blank to keep)" : "GOCSPX-…"}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Enable Google Sign-In</p>
              <p className="text-xs text-muted-foreground">Shows the “Continue with Google” button on login pages.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Enable Google One Tap</p>
              <p className="text-xs text-muted-foreground">Auto-shows the one-tap prompt for signed-in Google users.</p>
            </div>
            <Switch checked={oneTap} onCheckedChange={setOneTap} />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed">
          <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
            <AppIcon name="info" size={15} className="text-primary" />
            How to get the keys (Google Cloud Console)
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {GUIDE_LINKS.map((g) => (
              <li key={g.label} className="flex flex-col gap-0.5">
                <a
                  href={g.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline decoration-primary/40 underline-offset-2"
                >
                  {g.label}
                  <AppIcon name="arrowUpRight" size={12} />
                </a>
                <span>{g.hint}</span>
              </li>
            ))}
          </ul>

          <div className="my-3 h-px bg-border" />

          <p className="mb-2 text-xs text-muted-foreground">
            In the OAuth Client ID (type <strong>Web application</strong>), add these exactly:
          </p>
          <div className="space-y-3">
            <CopyField
              label="Authorized redirect URI (for sign-in)"
              value={`${origin}/auth/google/callback`}
            />
            <CopyField
              label="Authorized JavaScript origins (required for One Tap)"
              value={origin}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="gold" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save Google settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
