import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeletons";

export default function PaymentsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="space-y-8">
        <div>
          <Skeleton shimmer className="mb-4 h-5 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton shimmer className="h-4 w-full" />
                    <Skeleton shimmer className="h-3 w-full" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton shimmer className="ml-auto h-5 w-16 rounded-full" />
                    <Skeleton shimmer className="ml-auto h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
