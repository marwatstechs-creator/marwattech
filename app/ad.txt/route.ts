import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Redirect the old /ad.txt path to the canonical /ads.txt file that
 * Google AdSense checks. AdSense requires the "ads.txt" filename.
 */
export function GET() {
  return NextResponse.redirect(new URL("/ads.txt", "https://www.marwattech.com"), 301);
}
