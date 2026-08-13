import { Skeleton, SkeletonPageHeader, SkeletonText } from "@/components/ui/skeletons";

export default function ProjectsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton shimmer className="h-5 w-full" />
                <SkeletonText lines={2} />
              </div>
              <Skeleton shimmer className="h-5 w-16 shrink-0 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton shimmer className="h-3 w-16" />
                <Skeleton shimmer className="h-3 w-10" />
              </div>
              <Skeleton shimmer className="h-2 w-full rounded-full" />
            </div>
            <div className="mt-4 flex gap-4">
              <Skeleton shimmer className="h-3 w-24" />
              <Skeleton shimmer className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
