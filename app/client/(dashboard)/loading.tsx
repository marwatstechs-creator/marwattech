import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonButton,
  SkeletonList,
  SkeletonPageHeader,
  SkeletonStatCard,
} from "@/components/ui/skeletons";

export default function ClientDashboardLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              <Skeleton shimmer className="h-5 w-full" />
            </CardTitle>
            <SkeletonButton className="h-8 w-16" />
          </CardHeader>
          <CardContent className="space-y-3">
            <SkeletonList items={3} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              <Skeleton shimmer className="h-5 w-full" />
            </CardTitle>
            <SkeletonButton className="h-8 w-16" />
          </CardHeader>
          <CardContent className="space-y-3">
            <SkeletonList items={3} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
