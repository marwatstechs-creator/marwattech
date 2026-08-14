/**
 * Auto Udemy deals feed.
 *
 * Consumes the same public dataset the "fresh-coupons" browser extension uses
 * (https://github.com/fresh-coupons/fresh-coupons-data) — static JSON hosted on
 * GitHub, NOT live scraping of Udemy. Data is cached with ISR (6h) so each
 * deploy/revalidate window costs only a couple of fetches.
 */

const API_PREFIX =
  "https://raw.githubusercontent.com/fresh-coupons/fresh-coupons-data/main/udemy/v2/";

export type UdemyDeal = {
  title: string;
  url: string;
  image: string | null;
  code: string | null;
  discount: number | null;
  originalPrice: string | null;
  expiry: string | null;
  rating: number | null;
  category: string | null;
};

type RawCouponData = {
  couponCode?: string | null;
  originalPrice?: string | null;
  discountedPrice?: string | null;
  expirationText?: string | null;
  discountPercentage?: number | null;
};

type RawCourseDetails = {
  title?: string | null;
  courseUri?: string | null;
  imageUri?: string | null;
  rating?: { count?: number; averageValue?: string | null } | null;
  tags?: string[] | null;
};

type RawEntry = {
  courseDetails?: RawCourseDetails | null;
  couponData?: RawCouponData | null;
  isAlreadyAFreeCourse?: boolean;
};

type RawFile = {
  coursesWithCoupon?: Record<string, RawEntry> | null;
  freeCourses?: Record<string, RawEntry> | null;
};

const REVALIDATE = 3600; // 1h

/** Fetch with a single retry so transient GitHub hiccups don't empty the page. */
async function fetchJson(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: REVALIDATE } });
      if (res.ok) return res;
    } catch {
      // retry
    }
  }
  return null;
}

/** Fetch + parse the latest Udemy coupon dataset (best-effort). */
export async function fetchUdemyDeals(limit = 60): Promise<UdemyDeal[]> {
  try {
    const metaRes = await fetchJson(`${API_PREFIX}meta.json`);
    if (!metaRes) return [];
    const meta = (await metaRes.json()) as { lastSynced?: string };
    if (!meta.lastSynced) return [];

    const dataRes = await fetchJson(`${API_PREFIX}${meta.lastSynced}.json`);
    if (!dataRes) return [];
    const data = (await dataRes.json()) as RawFile;

    const deals: UdemyDeal[] = [];
    for (const [key, entry] of Object.entries(data.coursesWithCoupon ?? {})) {
      const cd = entry?.courseDetails;
      const coupon = entry?.couponData;
      if (!cd || !coupon) continue;
      deals.push({
        title: cd.title ?? "Udemy course",
        url: cd.courseUri ?? key,
        image: cd.imageUri ?? null,
        code: coupon.couponCode ?? null,
        discount: coupon.discountPercentage ?? null,
        originalPrice: coupon.originalPrice ?? null,
        expiry: coupon.expirationText ?? null,
        rating: cd.rating?.averageValue ? Number(cd.rating.averageValue) : null,
        category:
          Array.isArray(cd.tags) && cd.tags[0] ? cd.tags[0] : null,
      });
    }

    // 100% off first, then by rating.
    deals.sort(
      (a, b) =>
        (b.discount ?? 0) - (a.discount ?? 0) ||
        (b.rating ?? 0) - (a.rating ?? 0)
    );
    return deals.slice(0, limit);
  } catch {
    return [];
  }
}
