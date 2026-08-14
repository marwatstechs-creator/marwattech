import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";

export const dynamic = "force-dynamic";

/** Serves the ad.txt file content configured in Admin → Settings. */
export async function GET() {
  let content = "";
  try {
    const db = await createClient();
    const settings = await getSiteSettings(db);
    content = settings.ad_txt ?? "";
  } catch {
    // fall through
  }
  if (!content.trim()) {
    return new Response("ad.txt is not configured yet.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
