import QRCode from "qrcode";

import type { CertificateViewData } from "@/components/certificates/certificate-view";
import { createClient } from "@/lib/supabase/server";
import type { CertificateRow } from "./types";
import { certificateVerifyUrl, getCertificateSignatures } from "./utils";

/** Build the data the CertificateView needs (incl. the QR SVG), server-side. */
export async function buildCertificateViewData(
  cert: CertificateRow
): Promise<CertificateViewData> {
  const db = await createClient();
  const sig = await getCertificateSignatures(db);
  const verifyUrl = certificateVerifyUrl(cert.verification_code);

  let qrSvg = "";
  try {
    qrSvg = await QRCode.toString(verifyUrl, {
      type: "svg",
      margin: 1,
      width: 220,
      color: { dark: "#07145C", light: "#ffffff" },
    });
  } catch {
    qrSvg = "";
  }

  return {
    certificateNo: cert.certificate_no || `CERT-${cert.id.slice(0, 8)}`,
    verificationCode: cert.verification_code,
    studentName: cert.student_name,
    courseTitle: cert.course_title,
    courseCategory: cert.course_category,
    courseDuration: cert.course_duration,
    issueDate: cert.issue_date ?? cert.completion_date ?? "",
    completionDate: cert.completion_date ?? "",
    directorName: sig.director.name,
    directorTitle: sig.director.title,
    directorSignatureImage: sig.director.image,
    instructorName: cert.instructor_name || sig.instructor.name,
    instructorTitle: sig.instructor.title,
    instructorSignatureImage: sig.instructor.image,
    verifyUrl,
    qrSvg,
  };
}
