import { MediaGridSkeleton, SkeletonPageHeader } from "@/components/ui/skeletons";

export default function MediaLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <MediaGridSkeleton count={10} />
    </>
  );
}
