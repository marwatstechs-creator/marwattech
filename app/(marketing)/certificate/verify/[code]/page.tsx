import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppIcon } from "@/components/app-icon";
import type { CertificateRow } from "@/lib/certificates/types";
import { SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return buildMetadata({
    title: "Verify a Certificate",
    description: "Verify the authenticity of a Marwat Tech course completion certificate.",
    path: `/certificate/verify/${code}`,
    noindex: true,
  });
}

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  let cert: CertificateRow | null = null;
  try {
    const db = await createClient();
    const { data } = await db
      .from("certificates")
      .select("*")
      .eq("verification_code", code)
      .eq("status", "issued")
      .maybeSingle();
    cert = (data ?? null) as CertificateRow | null;
  } catch {
    cert = null;
  }
  if (!cert) notFound();

  return (
    <div className="container mx-auto max-w-2xl py-12 sm:py-16">
      <div className="rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <AppIcon name="check" size={32} />
        </span>
        <h1 className="font-display mt-5 text-2xl font-bold sm:text-3xl">Certificate Verified</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This certificate is authentic and was issued by {SITE.name}.
        </p>

        <div className="mx-auto mt-8 max-w-md space-y-3 rounded-2xl border bg-muted/40 p-6 text-left text-sm">
          <Row label="Student" value={cert.student_name} />
          <Row label="Course" value={cert.course_title} />
          <Row label="Completed" value={formatDate(cert.completion_date)} />
          <Row label="Certificate ID" value={cert.certificate_no} mono />
          <Row label="Verification Code" value={cert.verification_code} mono />
          <Row label="Issued By" value={SITE.name} />
        </div>

        <Link
          href={`/certificate/${cert.id}`}
          className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          View Certificate <AppIcon name="arrowRight" size={15} />
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={mono ? "font-mono text-foreground" : "text-right font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}
