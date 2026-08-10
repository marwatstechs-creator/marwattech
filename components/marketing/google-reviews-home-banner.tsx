import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { getGoogleReviews } from "@/lib/google/reviews";

/* ── Brand colors — Purple palette ──────────────────────────────────── */
const PURPLE = "#7464c6";
const GOLD = "#f8c640";
const DARK_PURPLE = "#5f4fa8";

export async function GoogleReviewsHomeBanner() {
  const data = await getGoogleReviews();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8 lg:p-10"
        style={{ borderColor: `${PURPLE}20`, background: `linear-gradient(135deg, ${PURPLE}06, ${GOLD}04, transparent)` }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: GOLD }} />
        <div className="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full opacity-15 blur-2xl" style={{ backgroundColor: PURPLE }} />

        <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
          {/* Left: Google badge + rating */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <GoogleGBadge />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-extrabold tabular-nums" style={{ color: PURPLE }}>
                    {data.rating}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 5</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <AppIcon key={i} name="star" size={14} color={GOLD} />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-border sm:block" />
            <p className="text-sm text-muted-foreground">
              Rated{" "}
              <strong className="font-semibold text-foreground">{data.rating}</strong>{" "}
              by{" "}
              <strong className="font-semibold text-foreground">{data.total}+ clients</strong>{" "}
              on Google Maps
            </p>
          </div>

          {/* Right: snippet + CTAs */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {data.reviews[0] && (
              <div
                className="hidden rounded-xl border px-4 py-2.5 text-sm italic text-muted-foreground lg:block"
                style={{ borderColor: `${GOLD}30`, backgroundColor: `${GOLD}05` }}
              >
                &ldquo;{data.reviews[0].text.slice(0, 100)}...&rdquo;
                <span className="mt-1 block text-xs text-foreground/70 not-italic">
                  — {data.reviews[0].author_name}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/testimonials">
                <span className="btn-3d-outline group h-9 rounded-full pl-4 pr-1.5 text-sm font-semibold">
                  <AppIcon name="star" size={14} color="#7464c6" />
                  Read All Reviews
                  <span className="relative inline-flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </span>
              </Link>
              <Link href={data.place_url} target="_blank" rel="noopener noreferrer">
                <span className="group inline-flex h-9 items-center gap-2 overflow-hidden rounded-full pl-4 pr-1.5 text-sm font-medium text-[#5f4fa8] transition-colors hover:bg-[#5f4fa8]/5">
                  <AppIcon name="external" size={14} color="#5f4fa8" />
                  Write a Review
                  <span className="relative inline-flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GoogleGBadge() {
  return (
    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-border">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
      </svg>
    </div>
  );
}
