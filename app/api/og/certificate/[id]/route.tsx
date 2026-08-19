/**
 * GET /api/og/certificate/:id  →  PNG thumbnail of the actual certificate.
 *
 * Used as the og:image for certificate links so that sharing on Facebook,
 * WhatsApp or LinkedIn shows the student's real certificate instead of the
 * generic Marwat Tech logo.
 */
import { readFileSync } from "fs";
import path from "path";
import { ImageResponse } from "@vercel/og";
import QRCode from "qrcode";

import { SITE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { certificateVerifyUrl } from "@/lib/certificates/utils";
import type { CertificateRow } from "@/lib/certificates/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── Fonts (WOFF files shipped via public/fonts) ──────────────────────── */
const readFont = (name: string) =>
  readFileSync(path.join(process.cwd(), "public", "fonts", name));

const fonts = [
  { name: "Inter", data: readFont("inter-400.woff"), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: readFont("inter-600.woff"), weight: 600 as const, style: "normal" as const },
  { name: "Inter", data: readFont("inter-700.woff"), weight: 700 as const, style: "normal" as const },
  { name: "Great Vibes", data: readFont("great-vibes.woff"), weight: 400 as const, style: "normal" as const },
  { name: "Dancing Script", data: readFont("dancing-script.woff"), weight: 600 as const, style: "normal" as const },
];

/* ── Static PNGs (badge + laurel, rasterized from the gold SVGs) ──────── */
const badgeData = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "public", "assets", "award-badge-og.png")
).toString("base64")}`;
const laurelData = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "public", "assets", "laurel-og.png")
).toString("base64")}`;

/* ── Palette (must match the live certificate) ────────────────────────── */
const NAVY = "#07145C";
const GOLD = "#D4AF37";
const GOLD_TEXT = "#B08D1F";
const INK = "#11142E";
const INK_SOFT = "#4A5170";

function formatDateLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function renderCertificate(cert: CertificateRow): Promise<ImageResponse> {
  const verifyUrl = certificateVerifyUrl(cert.verification_code);
  let qrData = "";
  try {
    qrData = await QRCode.toDataURL(verifyUrl, {
      type: "image/png",
      margin: 1,
      width: 220,
      color: { dark: NAVY, light: "#ffffff" },
    });
  } catch {
    qrData = "";
  }

  const studentName = cert.student_name;
  const nameSize = studentName.length > 24 ? 30 : 40;
  const courseTitle = cert.course_title;
  const courseSize = courseTitle.length > 42 ? 15 : 19;
  const certificateNo = cert.certificate_no || `CERT-${cert.id.slice(0, 8)}`;
  const issueDate = formatDateLabel(cert.issue_date ?? cert.completion_date ?? "");
  const duration = cert.course_duration;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${NAVY}, #0b1a6e)`,
        }}
      >
        {/* certificate card */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 891,
            height: 630,
            background: "linear-gradient(180deg, #FFFFFF 0%, #FDFCF5 100%)",
            overflow: "hidden",
          }}
        >
          {/* frames */}
          <div style={{ position: "absolute", left: 15, top: 15, width: 861, height: 600, border: `1px solid ${NAVY}`, opacity: 0.4 }} />
          <div style={{ position: "absolute", left: 18, top: 18, width: 855, height: 594, border: `2px solid ${GOLD}` }} />
          <div style={{ position: "absolute", left: 24, top: 24, width: 843, height: 582, border: `1px solid ${GOLD}`, opacity: 0.5 }} />

          {/* badge + laurel */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeData} width={111} height={111} style={{ position: "absolute", left: 53, top: 29 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={laurelData} width={136} height={136} style={{ position: "absolute", right: 35, top: 21 }} />

          {/* eyebrow */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 104,
              textAlign: "center", fontFamily: "Inter", fontWeight: 600,
              fontSize: 9.5, letterSpacing: 4, color: GOLD_TEXT,
            }}
          >
            Marwat Tech Academy
          </div>

          {/* Certificate (script) */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 118,
              textAlign: "center", fontFamily: "Great Vibes", fontSize: 76,
              color: GOLD, lineHeight: 1,
            }}
          >
            Certificate
          </div>

          {/* Of Completion */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 200,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
            }}
          >
            <div style={{ width: 64, height: 2, background: GOLD }} />
            <div style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)" }} />
            <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 17, letterSpacing: 5, color: GOLD }}>
              Of Completion
            </div>
            <div style={{ width: 8, height: 8, background: GOLD, transform: "rotate(45deg)" }} />
            <div style={{ width: 64, height: 2, background: GOLD }} />
          </div>

          {/* presented to */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 236,
              textAlign: "center", fontFamily: "Inter", fontWeight: 600,
              fontSize: 9.5, letterSpacing: 3.5, color: INK,
            }}
          >
            This Certificate Is Presented To
          </div>

          {/* student name (script) */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 248,
              textAlign: "center", fontFamily: "Great Vibes", fontSize: nameSize,
              color: GOLD, lineHeight: 1,
            }}
          >
            {studentName}
          </div>

          {/* divider */}
          <div style={{ position: "absolute", left: 250, right: 250, top: 298, height: 2, background: GOLD }} />

          {/* for completing */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 318,
              textAlign: "center", fontFamily: "Inter", fontSize: 10.5, color: INK,
            }}
          >
            For successfully completing
          </div>

          {/* course title */}
          <div
            style={{
              position: "absolute", left: 60, right: 60, top: 330,
              textAlign: "center", fontFamily: "Inter", fontWeight: 700,
              fontSize: courseSize, lineHeight: 1.2, color: GOLD_TEXT,
            }}
          >
            {courseTitle}
          </div>

          {/* signatures */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", gap: 90 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 220 }}>
              <div style={{ width: 200, height: 2, background: GOLD }} />
              <div style={{ marginTop: 8, fontFamily: "Inter", fontWeight: 600, fontSize: 11, color: INK }}>Irfan Shah</div>
              <div style={{ fontFamily: "Inter", fontSize: 8, letterSpacing: 2, color: INK_SOFT }}>DIRECTOR</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 220 }}>
              <div style={{ width: 200, height: 2, background: GOLD }} />
              <div style={{ marginTop: 8, fontFamily: "Inter", fontWeight: 600, fontSize: 11, color: INK }}>
                {cert.instructor_name || "Course Instructor"}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 8, letterSpacing: 2, color: INK_SOFT }}>COURSE INSTRUCTOR</div>
            </div>
          </div>

          {/* metadata */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, bottom: 26,
              textAlign: "center", fontFamily: "Inter", fontWeight: 500,
              fontSize: 8, letterSpacing: 0.8, color: INK,
            }}
          >
            {`Certificate No: ${certificateNo}  ·  Issue Date: ${issueDate}${duration ? `  ·  Duration: ${duration}` : ""}`}
          </div>

          {/* QR */}
          {qrData ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrData}
              width={110}
              height={110}
              style={{ position: "absolute", right: 40, bottom: 44, borderRadius: 6, border: `1.5px solid ${GOLD}` }}
            />
          ) : null}

          {/* verification seal (bottom-left) */}
          <div
            style={{
              position: "absolute", left: 40, bottom: 44, width: 118, height: 118,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%", border: `2px solid ${NAVY}`, opacity: 0.85,
            }}
          >
            <div style={{ position: "absolute", inset: 16, borderRadius: "50%", border: `1.5px solid ${GOLD}` }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  fontFamily: "Inter", fontWeight: 700, fontSize: 8, letterSpacing: 0.5,
                  color: GOLD_TEXT, textAlign: "center", lineHeight: 1.3,
                }}
              >
                {"Digitally\nVerifiable"}
              </div>
              <div style={{ width: 8, height: 8, marginTop: 4, background: GOLD, transform: "rotate(45deg)" }} />
            </div>
          </div>

          {/* footer url */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, bottom: 8,
              textAlign: "center", fontFamily: "Inter", fontSize: 7,
              letterSpacing: 2, color: GOLD_TEXT,
            }}
          >
            {SITE.url.replace("https://", "")}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!cert) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${NAVY}, #0b1a6e)`,
            color: "#ffffff",
          }}
        >
          <div style={{ textAlign: "center", fontFamily: "Inter", fontWeight: 600, fontSize: 40 }}>
            {SITE.name} — Certificate
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts }
    );
  }

  const res = await renderCertificate(cert);
  return res;
}
