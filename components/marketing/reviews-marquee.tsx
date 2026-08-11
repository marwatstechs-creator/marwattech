"use client";

import { TestimonialCard } from "@/components/marketing/testimonial-card";

type Review = {
  id: string;
  client_name: string;
  company: string | null;
  role: string | null;
  quote: string;
  rating: number;
  avatar_url: string | null;
};

/**
 * One-row, auto-scrolling review ticker. The track holds two copies of the
 * list and translates -50% continuously, which loops seamlessly forever.
 * Duration is tuned so ~one card walks past per second.
 */
export function ReviewsMarquee({ items }: { items: Review[] }) {
  if (items.length === 0) return null;

  const doubled = [...items, ...items];
  // One copy of the row crosses the viewport every `duration` seconds.
  const duration = Math.max(items.length * 2, 8);

  return (
    <div className="group relative overflow-hidden">
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />

      {/* Track */}
      <div
        className="marquee-track flex w-max gap-5 py-2 group-hover:[animation-play-state:paused]"
        style={{ animation: `reviews-marquee ${duration}s linear infinite` }}
      >
        {doubled.map((t, i) => (
          <div key={`${t.id}-${i}`} className="w-[300px] shrink-0 sm:w-[360px]">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes reviews-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
