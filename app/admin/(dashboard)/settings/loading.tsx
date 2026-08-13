import { FormSkeleton, SkeletonPageHeader } from "@/components/ui/skeletons";

export default function SettingsLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <FormSkeleton fields={3} />
    </>
  );
}
