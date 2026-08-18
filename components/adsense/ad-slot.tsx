import { AdUnit } from "@/components/adsense/ad-unit";
import { getAdForArea, type EnabledAd } from "@/lib/db/content";
import { createClient } from "@/lib/supabase/server";

/**
 * Reusable ad slot for a named area (see lib/ads.ts).
 *
 * Either pass an already-fetched `ad` (when the page already loaded ads) or
 * an `area` key — AdSlot will fetch the enabled config for that area and render
 * the exact AdSense unit configured in the admin. Renders nothing when the area
 * has no enabled ad, so pages are safe to include slots unconditionally.
 */
export async function AdSlot({
  area,
  ad,
  className,
}: {
  area?: string;
  ad?: EnabledAd | null;
  className?: string;
}) {
  let resolved = ad ?? null;
  if (!resolved && area) {
    try {
      const db = await createClient();
      resolved = await getAdForArea(db, area);
    } catch {
      resolved = null;
    }
  }
  if (!resolved) return null;

  return (
    <AdUnit
      adClient={resolved.ad_client}
      slotId={resolved.slot_id}
      format={resolved.format}
      className={className}
    />
  );
}
