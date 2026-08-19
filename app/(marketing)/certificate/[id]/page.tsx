import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppIcon } from "@/components/app-icon";
import { CertificateActions } from "@/components/certificates/certificate-actions";
import { CertificateView } from "@/components/certificates/certificate-view";
import { buildCertificateViewData } from "@/lib/certificates/rendering";
import type { CertificateRow } from "@/lib/certificates/types";
import { SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = await createClient();
    const { data } = await db
      .from("certificates")
      .select("*")
      .eq("id", id)
      .eq("status", "issued")
      .maybeSingle();
    if (!data) return {};
    return buildMetadata({
      title: `${data.student_name} — ${data.course_title} | Certificate`,
      description: `Certificate of completion awarded to ${data.student_name} for successfully completing ${data.course_title}.`,
      path: `/certificate/${id}`,
    });
  } catch {
    return {};
  }
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let cert: CertificateRow | null = null;
  try {
    const db = await createClient();
    const { data } = await db
      .from("certificates")
      .select("*")
      .eq("id", id)
      .eq("status", "issued")
      .maybeSingle();
    cert = (data ?? null) as CertificateRow | null;
  } catch {
    cert = null;
  }
  if (!cert) notFound();

  const viewData = await buildCertificateViewData(cert);

  return (
    <>
      {/* Print styles — print ONLY the certificate, exactly filling A4 landscape. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4 landscape; margin: 0; }
              html, body {
                width: 297mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: #fff !important;
              }
              header, footer, aside, .no-print { display: none !important; }
              main { padding: 0 !important; margin: 0 !important; }
              /* print ONLY the certificate: hide everything else, keep the cert visible */
              body * { visibility: hidden !important; }
              .cert-print-wrap, .cert-print-wrap * { visibility: visible !important; }
              .cert-print-wrap {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 297mm !important;
                height: 210mm !important;
                margin: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
              .cert-print-scale {
                transform: scale(0.79386) !important;
                transform-origin: top left !important;
              }
            }
          `,
        }}
      />

      <div className="container mx-auto py-10 sm:py-14">
        <CertificateActions data={viewData} />

        <div className="no-print mx-auto mb-8 flex flex-col items-center text-center">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Certificate of Completion
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Awarded to <span className="font-semibold text-foreground">{viewData.studentName}</span> for{" "}
            <span className="font-semibold text-foreground">{viewData.courseTitle}</span>.
          </p>
        </div>

        <div className="print-clean">
          <CertificateView data={viewData} />
        </div>

        <div className="no-print mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Verify this certificate publicly:
          </p>
          <Link
            href={`/certificate/verify/${viewData.verificationCode}`}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent-hover"
          >
            <AppIcon name="shield" size={15} /> Verify Certificate
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Issued by <span className="font-medium text-foreground">{SITE.name}</span> ·{" "}
            {SITE.url.replace("https://", "")}
          </p>
        </div>
      </div>
    </>
  );
}
