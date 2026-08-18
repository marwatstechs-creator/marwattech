"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AsyncSwitch } from "@/components/admin/async-switch";
import { AD_AREAS } from "@/lib/ads";
import { saveAdForArea, toggleAd, deleteAd } from "@/lib/actions/admin/ads";

export type AdminAdRow = {
  id: string;
  name: string;
  ad_client: string;
  slot_id: string | null;
  mobile_slot_id: string | null;
  mobile_format: string;
  format: string;
  placement: string;
  area: string | null;
  enabled: boolean;
  sort_order: number;
};

/** Rebuild a readable AdSense <ins> snippet from a stored ad. */
function toSnippet(ad?: AdminAdRow | null): string {
  if (!ad) return "";
  const lines = [
    '<ins class="adsbygoogle"',
    '     style="display:block"',
    `     data-ad-client="${ad.ad_client}"`,
  ];
  if (ad.slot_id) lines.push(`     data-ad-slot="${ad.slot_id}"`);
  lines.push(`     data-ad-format="${ad.format}"`);
  lines.push('     data-full-width-responsive="true"></ins>');
  return lines.join("\n");
}

/**
 * Per-location AdSense manager. Renders one card for every registered ad area
 * (see lib/ads.ts). Each card shows where the ad appears, the recommended
 * size, a code box to paste the AdSense snippet, a save/update button, an
 * enable/disable toggle and its current status.
 */
export function AdManager({ ads }: { ads: AdminAdRow[] }) {
  const router = useRouter();
  const byArea = React.useMemo(() => {
    const m: Record<string, AdminAdRow> = {};
    for (const a of ads) if (a.area) m[a.area] = a;
    return m;
  }, [ads]);
  const [codes, setCodes] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<string | null>(null);

  const saveArea = async (areaKey: string) => {
    const code = (codes[areaKey] ?? "").trim();
    if (!code) {
      toast.error("Paste your AdSense code for this location first.");
      return;
    }
    setSaving(areaKey);
    const res = await saveAdForArea(areaKey, code);
    setSaving(null);
    if (!res.ok) return toast.error(res.error || "Could not save ad");
    toast.success("Ad saved for this location");
    router.refresh();
  };

  const unassigned = ads.filter((a) => !a.area);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Every box below is a real location on the site — paste the AdSense code for that
        spot and it will appear exactly there. The recommended sizes are guidance for
        creating the AdSense unit; the frontend stays responsive.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {AD_AREAS.map((area) => {
          const ad = byArea[area.key];
          const code = codes[area.key] ?? toSnippet(ad);
          return (
            <Card key={area.key} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{area.label}</CardTitle>
                    <CardDescription>{area.section}</CardDescription>
                  </div>
                  {ad ? (
                    <Badge variant={ad.enabled ? "default" : "outline"} className="shrink-0">
                      {ad.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Not configured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Badge variant="gold" className="w-fit">{area.size}</Badge>
                  <p className="text-xs text-muted-foreground">{area.description}</p>
                </div>
                <Textarea
                  rows={5}
                  className="font-mono text-xs"
                  value={code}
                  onChange={(e) => setCodes((c) => ({ ...c, [area.key]: e.target.value }))}
                  placeholder={'<ins class="adsbygoogle" ...></ins>'}
                />
                <div className="mt-auto flex items-center justify-between gap-2">
                  {ad ? (
                    <div className="flex items-center gap-2">
                      <AsyncSwitch itemId={ad.id} checked={ad.enabled} action={toggleAd} label="Ad" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await deleteAd(ad.id);
                          toast.success("Ad removed");
                          router.refresh();
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No ad set for this spot</span>
                  )}
                  <Button size="sm" onClick={() => saveArea(area.key)} disabled={saving === area.key}>
                    <AppIcon name="save" size={14} className="mr-1" />
                    {saving === area.key ? "Saving…" : ad ? "Update" : "Save ad"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Other configured ads (no fixed location)</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Created before area slots — edit them on their own page.
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((a) => (
              <Badge key={a.id} variant="outline" className="gap-1">
                {a.name}
                <a href={`/admin/ads/${a.id}`} className="text-primary hover:underline">edit</a>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
