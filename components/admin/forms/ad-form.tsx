"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAd, updateAd } from "@/lib/actions/admin/ads";

export const AD_FORMATS = [
  { value: "auto", label: "Auto / Responsive (smart)" },
  { value: "fluid", label: "In-article (fluid)" },
  { value: "rectangle", label: "Large Rectangle (336×280)" },
  { value: "horizontal", label: "Leaderboard (728×90)" },
  { value: "vertical", label: "Half Page (300×600)" },
] as const;

export const AD_PLACEMENTS = [
  { value: "in_content", label: "Inside content (blog posts + study materials)" },
  { value: "listing", label: "Listing pages (blog grid + categories)" },
] as const;

export const AD_SIZES_GUIDE = [
  {
    format: "auto",
    title: "Responsive / Smart",
    size: "Adapts 320×100 → 970×90",
    note: "Best all-round. Create a Responsive ad unit in AdSense and it fills any width automatically.",
    recommended: true,
  },
  {
    format: "fluid",
    title: "In-article",
    size: "Fills the content width",
    note: "Flows inside article text — ideal for blog posts between paragraphs.",
  },
  {
    format: "rectangle",
    title: "Large Rectangle",
    size: "336×280",
    note: "Classic in-content / beside-text display ad.",
  },
  {
    format: "horizontal",
    title: "Leaderboard",
    size: "728×90",
    note: "Wide banner — great for top or bottom of listing pages.",
  },
  {
    format: "vertical",
    title: "Half Page",
    size: "300×600",
    note: "Tall sidebar-style display ad.",
  },
] as const;

type AdFormProps = {
  initial?: {
    id: string;
    name: string;
    ad_client: string;
    slot_id: string | null;
    format: string;
    placement: string;
    enabled: boolean;
    sort_order: number;
  };
  defaultClient?: string;
  isEdit?: boolean;
};

const FORMAT_LABELS: Record<string, string> = Object.fromEntries(
  AD_FORMATS.map((f) => [f.value, f.label])
);
const PLACEMENT_LABELS: Record<string, string> = Object.fromEntries(
  AD_PLACEMENTS.map((p) => [p.value, p.label])
);

export function AdForm({ initial, defaultClient, isEdit = false }: AdFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    ad_client: initial?.ad_client ?? defaultClient ?? "",
    slot_id: initial?.slot_id ?? "",
    format: initial?.format ?? "auto",
    placement: initial?.placement ?? "in_content",
    enabled: initial?.enabled ?? true,
    sort_order: initial?.sort_order ?? 0,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const payload = {
      name: form.name,
      ad_client: form.ad_client,
      slot_id: form.slot_id,
      format: form.format,
      placement: form.placement,
      enabled: form.enabled,
      sort_order: Number(form.sort_order) || 0,
    };
    const res = initial
      ? await updateAd(initial.id, payload)
      : await createAd(payload);
    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(initial ? "Ad updated" : "Ad created");
    router.push("/admin/ads");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-bold">Ad unit details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Ad name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Blog in-content ad"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad_client">AdSense Client ID</Label>
              <Input
                id="ad_client"
                value={form.ad_client}
                onChange={(e) => set("ad_client", e.target.value)}
                placeholder="ca-pub-1234567890123456"
                required
              />
              <p className="text-xs text-muted-foreground">
                Found in AdSense → Account → Settings. Pre-filled from Site settings.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot_id">Ad slot ID (optional)</Label>
              <Input
                id="slot_id"
                value={form.slot_id}
                onChange={(e) => set("slot_id", e.target.value)}
                placeholder="e.g. 1234567890"
              />
              <p className="text-xs text-muted-foreground">
                The 10-digit number from your AdSense ad unit code.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Order (0 = first)</Label>
              <Input
                id="sort_order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={form.format} onValueChange={(v) => set("format", v)}>
                <SelectTrigger>
                  <SelectValue>{FORMAT_LABELS[form.format] ?? form.format}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AD_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select value={form.placement} onValueChange={(v) => set("placement", v)}>
                <SelectTrigger>
                  <SelectValue>{PLACEMENT_LABELS[form.placement] ?? form.placement}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AD_PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
              <div>
                <p className="font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">
                  Disabled ads are not shown anywhere.
                </p>
              </div>
              <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size guidance */}
      <Card className="border-gold/30">
        <CardContent className="space-y-4 p-6">
          <div>
            <h3 className="font-display text-lg font-bold">Ad sizes to create in AdSense</h3>
            <p className="text-sm text-muted-foreground">
              Create the matching ad unit in your AdSense account, then pick its
              format here. All units render <strong>responsive/smart</strong> so they
              adapt to mobile &amp; desktop.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AD_SIZES_GUIDE.map((s) => (
              <div
                key={s.format}
                className={`rounded-xl border p-4 ${
                  s.recommended ? "border-gold bg-gold/5" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{s.title}</p>
                  {s.recommended && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-primary">{s.size}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{s.note}</p>
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
          <AppIcon name="save" size={16} />
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Ad"}
        </Button>
      </div>
    </form>
  );
}
