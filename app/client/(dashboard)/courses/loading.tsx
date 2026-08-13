import { Skeleton, SkeletonPageHeader, SkeletonText } from "@/components/ui/skeletons";

export default function CoursesLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-full flex-col gap-4 rounded-xl border bg-card p-6">
            <div className="flex items-start justify-between">
              <Skeleton shimmer className="size-12 rounded-xl" />
              <Skeleton shimmer className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton shimmer className="h-5 w-full" />
            <SkeletonText lines={2} />
            <div className="mt-auto flex justify-between">
              <Skeleton shimmer className="h-3 w-16" />
              <Skeleton shimmer className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
