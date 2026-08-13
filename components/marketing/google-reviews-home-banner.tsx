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
  const fullStars = Math.round(data.rating);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="card-3d relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8 lg:p-10"
        style={{ borderColor: `${PURPLE}26` }}
      >
        {/* Top gradient accent edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-gold to-[#5f4fa8]" />

        {/* Soft gradient wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${PURPLE}0a, ${GOLD}06 45%, transparent 72%)` }}
        />

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: GOLD }} />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: PURPLE }} />

        <div className="relative flex flex-col items-center gap-7 lg:flex-row lg:justify-between">
          {/* Left: Google badge + rating */}
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-4">
              <GoogleGBadge />
              <div className="flex flex-col gap-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <AppIcon name="shield" size={12} color={PURPLE} />
                  Google Reviews
                </span>
                <div className="flex items-end gap-1.5">
                  <span className="font-display text-4xl font-extrabold leading-none tabular-nums text-primary">
                    {data.rating}
                  </span>
                  <span className="pb-0.5 text-sm text-muted-foreground">/ 5</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <AppIcon key={i} name="star" size={16} color={i < fullStars ? GOLD : "rgba(148,163,184,0.35)"} />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden h-12 w-px bg-border sm:block" />
            <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
              <p className="text-sm text-muted-foreground">
                Rated <strong className="font-semibold text-foreground">{data.rating}</strong> by{" "}
                <strong className="font-semibold text-foreground">{data.total}+ clients</strong> on Google Maps
              </p>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-foreground/70"
                style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}0a` }}
              >
                <AppIcon name="check" size={12} color="#34a853" />
                Verified on Google Maps
              </span>
            </div>
          </div>

          {/* Right: snippet + CTAs */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            {data.reviews[0] && (
              <div
                className="relative hidden max-w-xs rounded-2xl border px-5 py-4 text-sm italic text-muted-foreground lg:block"
                style={{ borderColor: `${GOLD}30`, backgroundColor: `${GOLD}08` }}
              >
                <AppIcon name="quote" size={18} color={GOLD} className="absolute -left-2 -top-2 rounded-full bg-card p-1 shadow-sm" />
                &ldquo;{data.reviews[0].text.slice(0, 110)}...&rdquo;
                <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground not-italic">
                  — {data.reviews[0].author_name}
                  <AppIcon name="check" size={12} color="#34a853" />
                </span>
              </div>
            )}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/testimonials">
                <span className="btn-3d-gold group inline-flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-full pl-5 pr-1.5 text-sm font-semibold text-black sm:w-auto">
                  <AppIcon name="star" size={15} color="#111827" className="shrink-0" />
                  Read All Reviews
                  <span className="relative inline-flex h-7 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </span>
              </Link>
              <Link href={data.place_url} target="_blank" rel="noopener noreferrer">
                <span className="btn-3d-outline group inline-flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-full pl-5 pr-1.5 text-sm font-semibold sm:w-auto">
                  <GoogleMini />
                  Write a Review
                  <span className="relative inline-flex h-7 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
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
    <div
      className="grid size-16 shrink-0 place-items-center rounded-2xl border bg-white ring-1 ring-black/5"
      style={{ boxShadow: "0 10px 24px -10px rgba(116,100,198,0.4), inset 0 1px 0 rgba(255,255,255,0.8)" }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
      </svg>
    </div>
  );
}

function GoogleMini() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  );
}
