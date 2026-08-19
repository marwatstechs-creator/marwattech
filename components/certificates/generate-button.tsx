"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { generateCertificate } from "@/lib/actions/client/certificates";

export function GenerateCertificateButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [pending, startTransition] = useTransition();
  const [certId, setCertId] = useState<string | null>(null);

  const go = () => {
    startTransition(async () => {
      const res = await generateCertificate(courseId);
      if (res.ok) {
        toast.success("Certificate generated!");
        setCertId(res.certificate.id);
      } else {
        toast.error(res.error || "Could not generate the certificate.");
      }
    });
  };

  if (certId) {
    return (
      <Button asChild>
        <Link href={`/certificate/${certId}`}>
          <AppIcon name="medal" size={16} /> View Certificate
        </Link>
      </Button>
    );
  }

  return (
    <Button type="button" onClick={go} disabled={pending}>
      <AppIcon name={pending ? "refresh" : "sparkles"} size={16} className={pending ? "animate-spin" : ""} />
      {pending ? "Generating…" : "Generate Certificate"}
    </Button>
  );
}

/** Compact button for already-issued certificates (view). */
export function ViewCertificateButton({ id }: { id: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={`/certificate/${id}`}>
        <AppIcon name="eye" size={15} /> View
      </Link>
    </Button>
  );
}
