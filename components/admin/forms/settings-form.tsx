"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
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
  { key: "google_site_verification", label: "Google Search Console verification code", hint: "Search Console → Settings → Verification → HTML tag. Paste the content value (e.g. abc123…)." },
  { key: "bing_site_verification", label: "Bing Webmaster verification code", hint: "Bing Webmaster Tools → Site settings → Verification → HTML meta tag." },
  { key: "google_adsense_client", label: "Google AdSense Client ID", hint: "e.g. ca-pub-1234567890123456. Adds the AdSense loader to every page." },
  { key: "ad_txt", label: "ad.txt content", textarea: true, hint: "Paste your ad.txt content or upload the file. Served at /ad.txt for AdSense verification." },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const adTxtRef = useRef<HTMLInputElement>(null);

  const uploadOgImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const db = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `uploads/${Date.now()}-${safeName}`;
      const { error } = await db.storage
        .from("media")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = db.storage.from("media").getPublicUrl(path);
      setForm((s) => ({ ...s, og_image: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error("Upload failed — check that the media bucket exists and you have permission.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const uploadAdTxt = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setForm((s) => ({ ...s, ad_txt: String(reader.result ?? "") }));
      toast.success("ad.txt loaded — Save settings to publish it.");
    };
    reader.onerror = () => toast.error("Could not read the file.");
    reader.readAsText(file);
  };

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
                {f.key === "ad_txt" ? (
                  <div className="space-y-2">
                    <Textarea
                      id={f.key}
                      rows={6}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
                      className="font-mono text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        ref={adTxtRef}
                        type="file"
                        accept=".txt,text/plain"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadAdTxt(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => adTxtRef.current?.click()}
                        className="shrink-0"
                      >
                        <AppIcon name="upload" size={16} />
                        Upload ad.txt
                      </Button>
                      {form[f.key] ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm((s) => ({ ...s, ad_txt: "" }))}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : f.textarea ? (
                  <Textarea
                    id={f.key}
                    rows={2}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                ) : f.key === "og_image" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id={f.key}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                        placeholder="https://…"
                      />
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadOgImage(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0"
                      >
                        <AppIcon name={uploading ? "refresh" : "upload"} size={16} />
                        {uploading ? "Uploading…" : "Upload"}
                      </Button>
                    </div>
                    {form[f.key] ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form[f.key]}
                          alt="Social share preview"
                          className="h-14 w-24 rounded-lg border object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm((s) => ({ ...s, og_image: "" }))}
                        >
                          Clear
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Input
                    id={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                )}
                {f.hint ? (
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                ) : null}
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
