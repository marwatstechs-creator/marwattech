"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AppIcon } from "@/components/app-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/utils";
import type { GoogleReview } from "@/lib/google/reviews";

/* ── Brand colors — Purple palette ──────────────────────────────────── */
const PURPLE = "#7464c6";
const GOLD = "#f8c640";
const DARK_PURPLE = "#5f4fa8";

/* ── Auto-flowing Google Reviews Carousel ───────────────────────────── */

export function GoogleReviewsCarousel({ reviews }: { reviews: GoogleReview[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [current, setCurrent] = useState(0);

  // Duplicate reviews for seamless infinite scroll
  const doubled = [...reviews, ...reviews, ...reviews];

  /* Auto-advance every 3 seconds */
  const advance = useCallback(() => {
    setCurrent(prev => {
      const next = prev + 1;
      // When we reach the end of the first set, jump back
      if (next >= reviews.length * 2) return 0;
      return next;
    });
  }, [reviews.length]);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(advance, 3000);
    return () => clearInterval(id);
  }, [advance, isPaused]);

  /* Scroll to the current card (container-only — never scrolls the page) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[current] as HTMLElement | undefined;
    if (!card) return;
    const left = card.offsetLeft - el.offsetLeft - (el.clientWidth - card.clientWidth) / 2;
    el.scrollTo({ left, behavior: "smooth" });
  }, [current]);

  /* Instantly cancel any in-flight smooth scroll so the hovered card stops cleanly. */
  const cancelScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: el.scrollLeft, behavior: "auto" });
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    cancelScroll();
  }, [cancelScroll]);
  const resume = useCallback(() => setIsPaused(false), []);

  if (!reviews.length) return null;

  return (
    <div
      className="relative"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={() => {
        // Resume a little while after the touch ends so it doesn't fight swiping.
        setTimeout(resume, 3000);
      }}
    >
      {/* Scroll track */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {doubled.map((review, i) => (
          <div
            key={i}
            onMouseEnter={pause}
            onMouseLeave={resume}
            className="w-[85vw] shrink-0 snap-center sm:w-[380px] lg:w-[400px]"
          >
            <ReviewSlide review={review} />
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current % reviews.length ? 24 : 8,
              height: 8,
                backgroundColor: i === current % reviews.length ? PURPLE : "#d4d4d8",
            }}
            aria-label={`Go to review ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Individual review slide ────────────────────────────────────────── */

function ReviewSlide({ review }: { review: GoogleReview }) {
  return (
    <Card
      className="h-full transition-shadow duration-300 hover:shadow-lg"
      style={{ borderLeftWidth: 4, borderLeftColor: PURPLE }}
    >
      <CardContent className="flex h-full flex-col gap-4 p-6">
        {/* Quote icon + Stars */}
        <div className="flex items-center justify-between">
          <AppIcon name="quote" size={28} color={PURPLE} />
          <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <AppIcon
                key={i}
                name="star"
                size={15}
                color={i < review.rating ? GOLD : "#d4d4d8"}
              />
            ))}
          </div>
        </div>

        {/* Quote */}
        <blockquote className="flex-1 text-sm leading-relaxed text-foreground/85">
          &ldquo;{review.text}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 border-t pt-4">
          <Avatar className="size-10" style={{ boxShadow: `0 0 0 2px ${GOLD}40` }}>
            {review.profile_photo_url ? (
              <AvatarImage src={review.profile_photo_url} alt={review.author_name} />
            ) : (
              <AvatarFallback style={{ backgroundColor: `${PURPLE}18`, color: PURPLE, fontWeight: 700, fontSize: 14 }}>
                {initials(review.author_name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{review.author_name}</p>
            <p className="flex items-center gap-1 text-xs font-medium" style={{ color: DARK_PURPLE }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
              </svg>
              Google Review · {review.relative_time_description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
