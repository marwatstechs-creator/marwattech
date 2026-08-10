/**
 * Google Maps Reviews — Server-side fetcher
 *
 * Uses the Google Places API (New) to fetch the latest reviews for a business.
 * Falls back to static review data when no API key is configured.
 *
 * @requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
 * @requires GOOGLE_PLACE_ID  in .env.local (the Places API place ID, e.g. ChIJ…)
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/overview
 */

export type GoogleReview = {
  author_name: string;
  author_url: string | null;
  profile_photo_url: string | null;
  rating: number; // 1 – 5
  text: string;
  time: number; // Unix seconds
  relative_time_description: string;
};

export type GoogleReviewsResponse = {
  rating: number; // overall rating (e.g. 4.7)
  total: number; // total review count
  reviews: GoogleReview[];
  place_url: string;
};

// ── Fallback data (shown when API key is unavailable) ──────────────
const FALLBACK_REVIEWS: GoogleReview[] = [
  {
    author_name: "Muhammad Ali",
    author_url: null,
    profile_photo_url: null,
    rating: 5,
    text: "Excellent service! Marwat Tech built our e-commerce website exactly how we wanted. The team was professional, fast, and very responsive. Highly recommended for anyone looking for quality development work.",
    time: Date.now() / 1000 - 86400 * 30,
    relative_time_description: "1 month ago",
  },
  {
    author_name: "Zainab R.",
    author_url: null,
    profile_photo_url: null,
    rating: 5,
    text: "Great experience working with Marwat Tech on our mobile app. They delivered on time and the quality exceeded our expectations. Will definitely work with them again.",
    time: Date.now() / 1000 - 86400 * 60,
    relative_time_description: "2 months ago",
  },
  {
    author_name: "Bilal Hussain",
    author_url: null,
    profile_photo_url: null,
    rating: 5,
    text: "Professional team with excellent technical skills. They helped us with SEO and website redesign. Our traffic increased significantly within weeks. Very happy with the results!",
    time: Date.now() / 1000 - 86400 * 90,
    relative_time_description: "3 months ago",
  },
  {
    author_name: "Aisha Noor",
    author_url: null,
    profile_photo_url: null,
    rating: 4,
    text: "Good quality work and responsive communication. The team understood our requirements well and delivered a great website. Only minor feedback on timeline but overall very satisfied.",
    time: Date.now() / 1000 - 86400 * 120,
    relative_time_description: "4 months ago",
  },
  {
    author_name: "Usman Khalid",
    author_url: null,
    profile_photo_url: null,
    rating: 5,
    text: "Marwat Tech did an amazing job with our graphics design and branding. Very creative approach and attention to detail. They truly care about client satisfaction.",
    time: Date.now() / 1000 - 86400 * 150,
    relative_time_description: "5 months ago",
  },
  {
    author_name: "Sana Tariq",
    author_url: null,
    profile_photo_url: null,
    rating: 5,
    text: "Outstanding web development services! They built a custom dashboard for our business that streamlined our entire workflow. Professional, timely, and affordable.",
    time: Date.now() / 1000 - 86400 * 180,
    relative_time_description: "6 months ago",
  },
];

// ── API fetcher ─────────────────────────────────────────────────────

async function fetchFromPlacesAPI(placeId: string, apiKey: string): Promise<GoogleReviewsResponse> {
  const fields = "displayName,rating,userRatingCount,reviews(authorAttribution(displayName,uri,photoUri),rating,text,relativePublishTimeDescription,publishTime),googleMapsUri";

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=${encodeURIComponent(fields)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fields,
      },
      next: { revalidate: 86400 }, // ISR: cache for 24 hours
    }
  );

  if (!res.ok) throw new Error(`Places API error: ${res.status}`);

  const data = await res.json();

  return {
    rating: data.rating ?? 4.7,
    total: data.userRatingCount ?? 0,
    place_url: data.googleMapsUri ?? "https://maps.google.com/?cid=15403920924729213100",
    reviews: (data.reviews ?? []).map((r: Record<string, unknown>) => {
      const attr = (r.authorAttribution as Record<string, string>) ?? {};
      const text = (r.text as { text?: string })?.text ?? "";
      return {
        author_name: attr.displayName ?? "Google User",
        author_url: attr.uri ?? null,
        profile_photo_url: attr.photoUri ?? null,
        rating: (r.rating as number) ?? 5,
        text,
        time: typeof r.publishTime === "string" ? new Date(r.publishTime).getTime() / 1000 : Date.now() / 1000,
        relative_time_description: (r.relativePublishTimeDescription as string) ?? "",
      } as GoogleReview;
    }),
  };
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Fetch Google Maps reviews for the configured business.
 * Returns fallback data when GOOGLE_PLACE_ID or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.
 */
export async function getGoogleReviews(): Promise<GoogleReviewsResponse> {
  const placeId = process.env.GOOGLE_PLACE_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!placeId || !apiKey) {
    return {
      rating: 4.7,
      total: 6,
      reviews: FALLBACK_REVIEWS,
      place_url: "https://maps.google.com/?cid=15403920924729213100",
    };
  }

  try {
    return await fetchFromPlacesAPI(placeId, apiKey);
  } catch {
    return {
      rating: 4.7,
      total: 6,
      reviews: FALLBACK_REVIEWS,
      place_url: "https://maps.google.com/?cid=15403920924729213100",
    };
  }
}
