import { Skeleton, SkeletonPageHeader, SkeletonText } from "@/components/ui/skeletons";

export default function TicketsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton shimmer className="h-4 w-full" />
                  <Skeleton shimmer className="h-5 w-16 rounded-full" />
                </div>
                <SkeletonText lines={2} />
                <div className="flex gap-2">
                  <Skeleton shimmer className="h-4 w-16 rounded-full" />
                  <Skeleton shimmer className="h-4 w-12 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
