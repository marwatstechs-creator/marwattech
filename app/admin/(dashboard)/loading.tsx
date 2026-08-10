import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}
