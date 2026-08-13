import { SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeletons";

export default function TestimonialsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <SkeletonTable rows={8} cols={5} />
    </>
  );
}
