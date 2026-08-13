import { Skeleton, SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeletons";

export default function MessagesLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} shimmer className="h-8 w-28 rounded-md" />
        ))}
      </div>
      <div className="pt-4">
        <SkeletonTable rows={8} cols={5} />
      </div>
    </>
  );
}
