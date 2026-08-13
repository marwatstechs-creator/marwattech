import { PageHeroSkeleton, TestimonialCardSkeleton } from "@/components/ui/skeletons";

export default function TestimonialsLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <TestimonialCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
