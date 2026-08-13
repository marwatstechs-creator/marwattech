import { PageHeroSkeleton, PricingCardSkeleton } from "@/components/ui/skeletons";

export default function PricingLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <PricingCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
