import { getAdsTxtContent } from "@/lib/ads-txt";

export const dynamic = "force-dynamic";

/**
 * Serves the ads.txt file content configured in Admin → Settings.
 * This is the canonical path Google AdSense checks (ads.txt, not ad.txt).
 */
export async function GET() {
  const content = await getAdsTxtContent();
  if (!content.trim()) {
    return new Response("ads.txt is not configured yet.\n", {
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
