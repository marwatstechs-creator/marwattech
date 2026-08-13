import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export { Skeleton };

type SkeletonProps = React.ComponentProps<typeof Skeleton>;

/** One or more shimmering text-line placeholders. */
export function SkeletonText({
  lines = 1,
  widths,
  className,
}: {
  lines?: number;
  widths?: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shimmer
          className={cn("h-3.5 w-full", widths?.[i])}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({
  size = "size-10",
  className,
}: {
  size?: string;
  className?: string;
}) {
  return <Skeleton shimmer className={cn("rounded-full", size, className)} />;
}

export function SkeletonImage({ className }: SkeletonProps) {
  return <Skeleton shimmer className={cn("aspect-video w-full rounded-lg", className)} />;
}

export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton shimmer className={cn("h-9 w-24 rounded-md", className)} />;
}

/** Card-shaped skeleton: optional media, title, body lines, CTA line. */
export function SkeletonCard({
  hasImage = false,
  titleWidth = "w-full",
  lines = 2,
  className,
}: {
  hasImage?: boolean;
  titleWidth?: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col gap-3 rounded-xl border bg-card p-6", className)}>
      {hasImage && <SkeletonImage className="mb-1" />}
      <Skeleton shimmer className={cn("h-5 w-full", titleWidth)} />
      <SkeletonText lines={lines} />
      <Skeleton shimmer className="mt-auto h-4 w-full" />
    </div>
  );
}

/** Mirrors <StatCard/> (icon box + big value + label + hint). */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5", className)}>
      <Skeleton shimmer className="size-10 rounded-lg" />
      <Skeleton shimmer className="mt-4 h-8 w-full" />
      <Skeleton shimmer className="mt-2 h-3.5 w-full" />
      <Skeleton shimmer className="mt-2 h-3 w-full" />
    </div>
  );
}

/** Mirrors <AdminPageHeader/> (title + subtitle, optional action buttons). */
export function SkeletonPageHeader({
  withActions = false,
  className,
}: {
  withActions?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center",
        className
      )}
    >
      <div className="space-y-2">
        <Skeleton shimmer className="h-7 w-full sm:h-8" />
        <Skeleton shimmer className="h-3.5 w-full" />
      </div>
      {withActions && (
        <div className="flex flex-wrap gap-2">
          <SkeletonButton />
          <SkeletonButton className="w-32" />
        </div>
      )}
    </div>
  );
}

/** A grid of card skeletons (mirrors marketing / course grids). */
export function SkeletonCardGrid({
  count = 6,
  cols = "sm:grid-cols-2 lg:grid-cols-3",
  hasImage = false,
  className,
}: {
  count?: number;
  cols?: string;
  hasImage?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6", cols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} hasImage={hasImage} />
      ))}
    </div>
  );
}

/** List of row-item skeletons (used inside "Recent X" cards). */
export function SkeletonList({ items = 3, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <Skeleton shimmer className="h-3.5 w-full" />
            <Skeleton shimmer className="h-3 w-full" />
          </div>
          <Skeleton shimmer className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Mirrored skeletons — each mirrors the REAL card's DOM structure
   (same box, padding, aspect ratios, element positions) so the
   placeholder looks exactly like the content loading.
   ──────────────────────────────────────────────────────────────── */

/** Mirrors <ServiceCard/>: icon box + title + summary + "Learn more". */
export function ServiceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col gap-4 rounded-xl border bg-card p-6", className)}>
      <Skeleton shimmer className="size-12 rounded-xl" />
      <Skeleton shimmer className="h-5 w-3/4" />
      <div className="flex flex-col gap-2">
        <Skeleton shimmer className="h-3.5 w-full" />
        <Skeleton shimmer className="h-3.5 w-5/6" />
      </div>
      <Skeleton shimmer className="mt-auto h-4 w-28" />
    </div>
  );
}

/** Mirrors <BlogCard/>: 16:9 cover + badge + meta + title + excerpt. */
export function BlogCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-xl border bg-card", className)}>
      <div className="relative aspect-[16/9] bg-muted/40">
        <Skeleton shimmer className="absolute left-3 top-3 h-5 w-16 rounded-md" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <Skeleton shimmer className="h-3 w-20" />
          <Skeleton shimmer className="h-3 w-16" />
        </div>
        <Skeleton shimmer className="h-5 w-3/4" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton shimmer className="h-3.5 w-full" />
          <Skeleton shimmer className="h-3.5 w-5/6" />
        </div>
        <Skeleton shimmer className="h-3 w-24" />
      </div>
    </div>
  );
}

/** Mirrors <PortfolioCard/>: 4:3 image + badge + title + industry. */
export function PortfolioCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("block", className)}>
      <div className="relative overflow-hidden rounded-xl border bg-muted/40">
        <Skeleton shimmer className="aspect-[4/3] w-full" />
        <Skeleton shimmer className="absolute left-3 top-3 h-5 w-20 rounded-full" />
      </div>
      <div className="mt-3 space-y-1.5 px-1">
        <Skeleton shimmer className="h-5 w-3/4" />
        <Skeleton shimmer className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}

/** Mirrors <TestimonialCard/>: quote icon + stars + quote + author row. */
export function TestimonialCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col gap-4 rounded-xl border bg-card p-6", className)}>
      <div className="flex items-center justify-between">
        <Skeleton shimmer className="size-7 rounded-md" />
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} shimmer className="size-4 rounded-sm" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton shimmer className="h-3.5 w-full" />
        <Skeleton shimmer className="h-3.5 w-5/6" />
      </div>
      <div className="flex items-center gap-3 border-t pt-4">
        <Skeleton shimmer className="size-10 shrink-0 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton shimmer className="h-3.5 w-28" />
          <Skeleton shimmer className="h-3 w-36" />
        </div>
      </div>
    </div>
  );
}

/** Mirrors <PricingSubscribe/> plan card: name + price + features + CTA. */
export function PricingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col rounded-3xl border bg-card p-8", className)}>
      <Skeleton shimmer className="h-5 w-28" />
      <Skeleton shimmer className="mt-1 h-3.5 w-3/4" />
      <div className="mt-5 flex items-end gap-1">
        <Skeleton shimmer className="h-9 w-24" />
        <Skeleton shimmer className="h-4 w-12" />
      </div>
      <ul className="mt-6 flex-1 space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-2">
            <Skeleton shimmer className="size-4 shrink-0 rounded-sm" />
            <Skeleton shimmer className="h-3.5 w-3/4" />
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Skeleton shimmer className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

/** Mirrors <PageHero/>: badge + big title + description. */
export function PageHeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden border-b bg-muted/40", className)}>
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <Skeleton shimmer className="mx-auto mb-4 h-5 w-32 rounded-full" />
        <Skeleton shimmer className="mx-auto h-10 w-2/3 max-w-xl sm:h-12" />
        <Skeleton shimmer className="mx-auto mt-4 h-4 w-3/4 max-w-lg" />
        <Skeleton shimmer className="mx-auto mt-2 h-4 w-1/2 max-w-md" />
      </div>
    </div>
  );
}

/** Table-shaped skeleton (mirrors admin shadcn tables). */
export function SkeletonTable({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div
        className="grid items-center gap-4 border-b bg-muted/50 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} shimmer className="h-3.5 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid items-center gap-4 border-b px-4 py-3.5 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="space-y-1.5">
              <Skeleton shimmer className="h-3.5 w-5/6" />
              <Skeleton shimmer className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Mirrors the admin Media Library: toolbar + grid of 4:3 image tiles. */
export function MediaGridSkeleton({
  count = 10,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton shimmer className="h-4 w-44" />
        <Skeleton shimmer className="h-9 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <Skeleton shimmer className="aspect-[4/3] w-full" />
            <div className="space-y-1.5 p-3">
              <Skeleton shimmer className="h-3 w-3/4" />
              <Skeleton shimmer className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Form-shaped skeleton (mirrors admin settings/forms). */
export function FormSkeleton({ fields = 3, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("max-w-2xl space-y-6", className)}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-xl border bg-card p-6">
          <Skeleton shimmer className="h-5 w-40" />
          <div className="grid gap-4">
            {Array.from({ length: fields }).map((_, j) => (
              <Skeleton key={j} shimmer className="h-10 w-full rounded-md" />
            ))}
          </div>
          <Skeleton shimmer className="h-9 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Landing hero banner skeleton (mirrors the home <Hero/> region). */
export function HeroBannerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden border-b bg-muted/40", className)}>
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <Skeleton shimmer className="mx-auto mb-6 h-5 w-40 rounded-full" />
        <Skeleton shimmer className="mx-auto h-12 w-4/5 max-w-2xl sm:h-14" />
        <Skeleton shimmer className="mx-auto mt-3 h-12 w-3/5 max-w-lg sm:h-14" />
        <Skeleton shimmer className="mx-auto mt-6 h-4 w-2/3 max-w-xl" />
        <div className="mt-8 flex justify-center gap-3">
          <Skeleton shimmer className="h-11 w-36 rounded-md" />
          <Skeleton shimmer className="h-11 w-36 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** Detail/article page skeleton (hero + image + prose lines + related cards). */
export function DetailPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      <div className="mx-auto max-w-3xl py-14">
        <Skeleton shimmer className="h-8 w-3/4 sm:h-10" />
        <Skeleton shimmer className="mt-4 h-4 w-2/3" />
        <Skeleton shimmer className="mt-2 h-4 w-1/2" />
        <Skeleton shimmer className="mt-8 h-64 w-full rounded-xl" />
        <div className="mt-8 space-y-3">
          <Skeleton shimmer className="h-3.5 w-full" />
          <Skeleton shimmer className="h-3.5 w-full" />
          <Skeleton shimmer className="h-3.5 w-5/6" />
          <Skeleton shimmer className="h-3.5 w-full" />
          <Skeleton shimmer className="h-3.5 w-4/6" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl pb-14">
        <Skeleton shimmer className="mb-6 h-6 w-40" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Avatar-row list skeleton (mirrors admin dashboard Recent messages/posts). */
export function SkeletonAvatarList({ items = 4, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton shimmer className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton shimmer className="h-3.5 w-3/4" />
            <Skeleton shimmer className="h-3 w-2/3" />
          </div>
          <Skeleton shimmer className="h-3 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}
