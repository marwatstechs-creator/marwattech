import { Skeleton, SkeletonPageHeader, SkeletonText } from "@/components/ui/skeletons";

export default function MaterialsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5">
            <Skeleton shimmer className="size-10 rounded-lg" />
            <Skeleton shimmer className="h-5 w-full" />
            <SkeletonText lines={2} />
            <div className="mt-auto flex items-center justify-between">
              <Skeleton shimmer className="h-4 w-20 rounded-full" />
              <Skeleton shimmer className="h-9 w-28 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
