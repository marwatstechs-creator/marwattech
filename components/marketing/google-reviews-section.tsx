import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { GoogleReviewsCarousel } from "@/components/marketing/google-reviews-carousel";
import { getGoogleReviews } from "@/lib/google/reviews";

/* ── Brand colors — Purple palette ──────────────────────────────────── */
const PURPLE = "#7464c6";
const GOLD = "#f8c640";
const DARK_PURPLE = "#5f4fa8";

export async function GoogleReviewsSection() {
  const data = await getGoogleReviews();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/5 via-transparent to-transparent">
      {/* Decorative top glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-12 text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
            style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}10`, color: GOLD }}
          >
            <AppIcon name="star" size={14} color={GOLD} />
            Google Reviews
          </span>

          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Real reviews from real clients — see why businesses trust Marwat Tech on Google Maps.
          </p>
        </div>

        {/* ── Rating Summary Card ─────────────────────────────── */}
        <div className="mx-auto mb-12 max-w-lg">
          <div
            className="flex flex-col items-center gap-6 rounded-2xl border p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: `${PURPLE}30`, background: `linear-gradient(135deg, ${PURPLE}08, transparent 50%)` }}
          >
            {/* Rating number */}
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-5xl font-extrabold tabular-nums" style={{ color: PURPLE }}>
                {data.rating}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <AppIcon key={i} name="star" size={16} color={GOLD} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{data.total} Google reviews</span>
            </div>

            <div className="hidden h-16 w-px bg-border sm:block" />
            <div className="block h-px w-32 bg-border sm:hidden" />

            <div className="flex flex-col items-center gap-3 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
              </svg>
              <Link
                href={data.place_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                style={{ color: DARK_PURPLE }}
              >
                View on Google Maps <AppIcon name="external" size={14} color={DARK_PURPLE} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Auto-flowing Reviews Carousel ─────────────────── */}
        <GoogleReviewsCarousel reviews={data.reviews} />

        {/* Leave a review CTA */}
        <div className="mt-12 text-center">
          <Link
            href={data.place_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-all hover:scale-105"
            style={{
              borderColor: PURPLE,
              backgroundColor: `${PURPLE}10`,
              color: PURPLE,
            }}
          >
            <AppIcon name="star" size={16} color={PURPLE} />
            Leave a Review on Google
            <AppIcon name="external" size={14} color={PURPLE} />
          </Link>
        </div>
      </div>
    </section>
  );
}
