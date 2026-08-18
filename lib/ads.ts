/**
 * Central ad-area registry.
 *
 * Every named advertisement location on the site lives here with its human
 * label, the page/section it belongs to, the recommended AdSense size and a
 * plain-English "where it appears" description. The admin panel lists these
 * areas so a manager knows exactly what will happen when they paste code into
 * a box, and the frontend renders a slot by its area key.
 *
 * Frontend components never hardcode ad codes — they render <AdSlot area="…" />.
 */

export type AdArea = {
  /** Stable machine key used by <AdSlot> and stored on the ads row (area column). */
  key: string;
  /** Short human name, e.g. "Article After Download". */
  label: string;
  /** Which product area it belongs to, e.g. "Source Code". */
  page: string;
  /** Full section title shown in admin, e.g. "Source Code — Article After Download". */
  section: string;
  /** Recommended AdSense size guidance, e.g. "336 × 280 — Large Rectangle". */
  size: string;
  /** Where the ad actually appears on the page. */
  description: string;
};

export const AD_AREAS: AdArea[] = [
  // ── Blog ────────────────────────────────────────────────────────────
  {
    key: "blog-top",
    label: "Blog Top",
    page: "Blog",
    section: "Blog — Top Advertisement",
    size: "728 × 90 — Leaderboard",
    description: "Top of the blog listing page, above the post cards.",
  },
  {
    key: "blog-between",
    label: "Blog Between Posts",
    page: "Blog",
    section: "Blog — Between Posts",
    size: "300 × 250 — Medium Rectangle (Responsive)",
    description: "Between post cards on the blog listing page.",
  },
  {
    key: "blog-article-top",
    label: "Blog Article Top",
    page: "Blog",
    section: "Blog — Article Top",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Top of every blog article, above the content.",
  },
  {
    key: "blog-article-mid",
    label: "Blog Article Mid Content",
    page: "Blog",
    section: "Blog — Article Mid Content",
    size: "336 × 280 — Large Rectangle (In-article)",
    description: "Mid-way through every blog article.",
  },
  {
    key: "blog-article-bottom",
    label: "Blog Article Bottom",
    page: "Blog",
    section: "Blog — Article Bottom",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Bottom of every blog article.",
  },
  // ── Source Code ─────────────────────────────────────────────────────
  {
    key: "code-scripts-top",
    label: "Source Code Main Top",
    page: "Source Code",
    section: "Source Code — Main Top",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Top of the source code listing page, above the script grid.",
  },
  {
    key: "code-scripts-between",
    label: "Source Code Between Content",
    page: "Source Code",
    section: "Source Code — Main Between Content",
    size: "300 × 250 — Medium Rectangle (Responsive)",
    description: "Between script cards on the source code listing page.",
  },
  {
    key: "code-scripts-article-top",
    label: "Source Code Article Top",
    page: "Source Code",
    section: "Source Code — Article Top",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Top of every source code article, above the content.",
  },
  {
    key: "code-scripts-article-after-download",
    label: "After Download",
    page: "Source Code",
    section: "Source Code — Article After Download",
    size: "336 × 280 — Large Rectangle (In-article)",
    description: "Immediately after the Download button on every script page.",
  },
  {
    key: "code-scripts-article-below-download",
    label: "Below Download",
    page: "Source Code",
    section: "Source Code — Article Below Download",
    size: "300 × 250 — Medium Rectangle (Responsive)",
    description: "Below the download/mirrors section on every script page.",
  },
  {
    key: "code-scripts-article-bottom",
    label: "Source Code Article Bottom",
    page: "Source Code",
    section: "Source Code — Article Bottom",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Near the end of every source code article.",
  },
  // ── Study Material ──────────────────────────────────────────────────
  {
    key: "study-top",
    label: "Study Material Main Top",
    page: "Study Material",
    section: "Study Material — Main Top",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Top of the study material main page.",
  },
  {
    key: "study-between",
    label: "Study Material Between Subjects",
    page: "Study Material",
    section: "Study Material — Between Subjects",
    size: "300 × 250 — Medium Rectangle (Responsive)",
    description: "Between subject cards on the study material main page.",
  },
  {
    key: "study-content-top",
    label: "Study Material Content Top",
    page: "Study Material",
    section: "Study Material — Content Top",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Top of study material content / slide pages.",
  },
  {
    key: "study-content-mid",
    label: "Study Material Mid Content",
    page: "Study Material",
    section: "Study Material — Mid Content",
    size: "336 × 280 — Large Rectangle (In-article)",
    description: "Mid-way through study material content.",
  },
  {
    key: "study-content-bottom",
    label: "Study Material Content Bottom",
    page: "Study Material",
    section: "Study Material — Content Bottom",
    size: "728 × 90 — Leaderboard (Responsive)",
    description: "Bottom of study material content / slide pages.",
  },
];

export const AD_AREA_BY_KEY: Record<string, AdArea> = Object.fromEntries(
  AD_AREAS.map((a) => [a.key, a])
);

/** Returns an area definition, or undefined for an unknown key. */
export function getAdArea(key: string): AdArea | undefined {
  return AD_AREA_BY_KEY[key];
}

/**
 * Extract the AdSense client id / slot id / format from a pasted AdSense
 * <ins> snippet so an admin can paste their code without fiddling with
 * individual fields. Returns nulls when it can't be parsed.
 */
export function parseAdSenseCode(code: string): {
  ad_client: string | null;
  slot_id: string | null;
  format: string | null;
} {
  const c = code || "";
  const client = c.match(/data-ad-client=["']([^"']+)["']/i)?.[1] ?? null;
  const slot = c.match(/data-ad-slot=["']([^"']+)["']/i)?.[1] ?? null;
  const format = c.match(/data-ad-format=["']([^"']+)["']/i)?.[1] ?? null;
  return { ad_client: client, slot_id: slot, format };
}
