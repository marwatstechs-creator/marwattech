"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { enrollInCourse } from "@/lib/actions/client/courses";

export function EnrollButton({
  courseId,
  className,
}: {
  courseId: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const enroll = async () => {
    if (pending) return;
    setPending(true);
    const res = await enrollInCourse(courseId);
    setPending(false);
    if (!res.ok) return toast.error(res.error || "Could not enroll.");
    toast.success("Enrolled! You can now start the course.");
    router.refresh();
  };

  return (
    <Button variant="gold" onClick={enroll} disabled={pending} className={className}>
      {pending ? "Enrolling…" : "Enroll Now"}
    </Button>
  );
}
