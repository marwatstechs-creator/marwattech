"use client";

import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateCertificateButton } from "@/components/certificates/generate-button";

export function CourseCertificateCard({
  courseId,
  courseTitle,
  enrolled,
  complete,
  hasCertificate,
  certificateId,
  progressPct,
}: {
  courseId: string;
  courseTitle: string;
  enrolled: boolean;
  complete: boolean;
  hasCertificate: boolean;
  certificateId: string | null;
  progressPct: number;
}) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div
        className="flex items-center gap-4 p-5"
        style={{ background: "linear-gradient(135deg, #07145C 0%, #0B1F78 60%, #06134F 100%)" }}
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/50 bg-white/5">
          <AppIcon name="medal" size={28} className="text-[#D4AF37]" />
        </span>
        <div className="flex-1">
          <p className="font-display text-base font-bold text-white">Course Completion Certificate</p>
          <p className="text-sm text-white/70">
            {!enrolled
              ? "Enroll and finish every lesson to earn your certificate."
              : complete
                ? "Congratulations! You have completed every lesson."
                : `${progressPct}% complete — finish all lessons to unlock your certificate.`}
          </p>
        </div>
        <div className="shrink-0">
          {hasCertificate && certificateId ? (
            <Button asChild>
              <Link href={`/certificate/${certificateId}`}>
                <AppIcon name="eye" size={15} /> View Certificate
              </Link>
            </Button>
          ) : complete ? (
            <GenerateCertificateButton courseId={courseId} courseTitle={courseTitle} />
          ) : (
            <Button disabled variant="outline" className="border-white/20 text-white/60">
              <AppIcon name="lock" size={15} /> Locked
            </Button>
          )}
        </div>
      </div>
      {!complete && (
        <CardContent className="p-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
