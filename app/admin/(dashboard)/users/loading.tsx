import { SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeletons";

export default function UsersLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <SkeletonTable rows={10} cols={5} />
    </>
  );
}
