"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { saveSettings } from "@/lib/actions/admin/settings";

const FIELDS: { key: string; label: string; textarea?: boolean; hint?: string }[] = [
  { key: "site_name", label: "Site name" },
  { key: "site_tagline", label: "Site tagline" },
  { key: "contact_email", label: "Contact email" },
  { key: "support_email", label: "Support email" },
  { key: "form_notify_email", label: "Form notification emails (comma separated)" },
  { key: "default_meta_title", label: "Default meta title", textarea: true },
  { key: "default_meta_description", label: "Default meta description", textarea: true },
  { key: "og_image", label: "Default social share image URL" },
  { key: "gtm_id", label: "Google Tag Manager ID" },
  { key: "ga_id", label: "Google Analytics ID" },
  { key: "clarity_id", label: "Microsoft Clarity ID" },
  { key: "posthog_key", label: "PostHog project key" },
  { key: "announcement_bar", label: "Announcement bar text", textarea: true },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await saveSettings(form);
    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-bold">Site settings</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                {f.textarea ? (
                  <Textarea
                    id={f.key}
                    rows={2}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (
            <>
              <AppIcon name="save" size={16} />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
