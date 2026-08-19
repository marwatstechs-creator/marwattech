import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";

/** Shown on Courses / Study Materials when the user isn't an approved student. */
export function StudentGate() {
  return (
    <div className="rounded-xl border border-dashed bg-muted/40 p-12 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <AppIcon name="award" size={28} />
      </div>
      <h3 className="font-display text-lg font-semibold">Students only</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Courses and study materials are available to approved students only.
        Apply to become a student from your profile and we&apos;ll review your
        request.
      </p>
      <Button asChild className="mt-5">
        <Link href="/client/settings">Apply to become a student</Link>
      </Button>
    </div>
  );
}
