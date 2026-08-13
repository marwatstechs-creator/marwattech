import { SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeletons";

export default function CareersLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <SkeletonTable rows={8} cols={5} />
    </>
  );
}
