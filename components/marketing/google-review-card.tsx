"use client";

import { AppIcon } from "@/components/app-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import type { GoogleReview } from "@/lib/google/reviews";

const GoogleGLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
  </svg>
);

export function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      {/* Google badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GoogleGLogo />
          <span className="text-xs font-medium text-muted-foreground">Google Review</span>
        </div>
        <Badge variant="outline" className="gap-1 border-gold/30 bg-gold/5 text-[10px] text-gold">
          <AppIcon name="star" size={10} />
          {review.rating}
        </Badge>
      </div>

      {/* Stars */}
      <div className="mb-3 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <AppIcon
            key={i}
            name="star"
            size={14}
            color={i < review.rating ? "hsl(var(--gold))" : undefined}
            className={i < review.rating ? "text-gold" : "text-muted-foreground/30"}
          />
        ))}
      </div>

      {/* Review text */}
      <blockquote className="mb-4 flex-1 text-sm leading-relaxed text-foreground/80">
        &ldquo;{review.text}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 border-t pt-4">
        <Avatar className="size-9 ring-1 ring-border">
          {review.profile_photo_url ? (
            <AvatarImage src={review.profile_photo_url} alt={review.author_name} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
              {initials(review.author_name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{review.author_name}</p>
          <p className="text-xs text-muted-foreground">{review.relative_time_description}</p>
        </div>
      </div>
    </div>
  );
}
