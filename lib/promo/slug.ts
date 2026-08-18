/**
 * Stable URL slug for a promo code (used for the per-deal page + sitemap).
 *
 * Derived from the title so it stays readable and stable across syncs; the
 * id is only used as a fallback when the title produces an empty slug.
 */
export function promoCodeSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || `deal-${id.slice(0, 8)}`;
}
