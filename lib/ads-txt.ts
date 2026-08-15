import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";

/** Loads the ads.txt content configured in Admin → Settings. */
export async function getAdsTxtContent(): Promise<string> {
  try {
    const db = await createClient();
    const settings = await getSiteSettings(db);
    return settings.ad_txt ?? "";
  } catch {
    return "";
  }
}
