"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import type { CertificateViewData } from "@/components/certificates/certificate-view";

export function CertificateActions({ data }: { data: CertificateViewData }) {
  const [copied, setCopied] = useState(false);

  const downloadPdf = () => {
    // Use the browser's print-to-PDF. Set the title so the default filename
    // matches "Certificate-{student_name}-{certificate_id}.pdf".
    const clean = data.studentName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
    document.title = `Certificate-${clean}-${data.certificateNo}`;
    window.print();
  };

  const share = async () => {
    const shareData = {
      title: `${data.studentName} — ${data.courseTitle} Certificate`,
      text: `${data.studentName} completed "${data.courseTitle}" — verify here.`,
      url: data.verifyUrl,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled / share unsupported — fall through to copy
      }
    }
    copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.verifyUrl);
      setCopied(true);
      toast.success("Verification link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — copy the URL manually.");
    }
  };

  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-2">
      <Button type="button" onClick={downloadPdf}>
        <AppIcon name="download" size={16} /> Download PDF
      </Button>
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <AppIcon name="settings" size={15} /> Print
      </Button>
      <Button type="button" variant="outline" onClick={share}>
        <AppIcon name="share" size={15} /> Share
      </Button>
      <Button type="button" variant="outline" onClick={copyLink}>
        <AppIcon name={copied ? "check" : "link"} size={15} /> {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
