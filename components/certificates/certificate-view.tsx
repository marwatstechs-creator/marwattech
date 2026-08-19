"use client";

import { useEffect, useRef, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icons";

/* ── Palette (navy + gold on white paper) ────────────────────────────── */
const NAVY = "#07145C";
const GOLD = "#D4AF37";
const WHITE = "#FFFFFF";
// White-paper palette: black ink text + deep-gold accents.
const INK = "#11142E";
const INK_SOFT = "#4A5170";
const GOLD_TEXT = "#B08D1F";

const DESIGN_W = 1414;
const DESIGN_H = 1000;

export type CertificateViewData = {
  certificateNo: string;
  verificationCode: string;
  studentName: string;
  courseTitle: string;
  courseCategory: string | null;
  courseDuration: string | null;
  issueDate: string;
  completionDate: string;
  directorName: string;
  directorTitle: string;
  directorSignatureImage?: string | null;
  instructorName: string;
  instructorTitle: string;
  instructorSignatureImage?: string | null;
  verifyUrl: string;
  qrSvg?: string;
};

function formatDateLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* ── Simple certificate: white paper, clean gold frame, no heavy ornament ── */

/* ── Animated service icons (like the CTA banner background) ────────────
   More of them, very low opacity, gently floating for a lively but subtle
   paper background. The float transform bakes in the -50%/-50% centering so
   it never fights the left/top positioning. */
const BG_ICONS: {
  icon: IconName;
  left: string;
  top: string;
  size: number;
  opacity: number;
  dur: number;
  delay: number;
}[] = [
  { icon: "code", left: "4%", top: "14%", size: 22, opacity: 0.16, dur: 7, delay: -1 },
  { icon: "wordpress", left: "7%", top: "50%", size: 20, opacity: 0.13, dur: 9, delay: -3 },
  { icon: "ecommerce", left: "9%", top: "84%", size: 24, opacity: 0.15, dur: 8, delay: -5 },
  { icon: "seo", left: "13%", top: "22%", size: 20, opacity: 0.18, dur: 6, delay: -2 },
  { icon: "mobile", left: "17%", top: "91%", size: 22, opacity: 0.13, dur: 10, delay: -6 },
  { icon: "ai", left: "22%", top: "10%", size: 18, opacity: 0.16, dur: 8, delay: -4 },
  { icon: "design", left: "26%", top: "78%", size: 20, opacity: 0.15, dur: 7, delay: -1 },
  { icon: "rocket", left: "31%", top: "20%", size: 22, opacity: 0.18, dur: 6, delay: -3 },
  { icon: "target", left: "35%", top: "93%", size: 18, opacity: 0.13, dur: 9, delay: -5 },
  { icon: "chart", left: "40%", top: "12%", size: 22, opacity: 0.16, dur: 8, delay: -2 },
  { icon: "nextjs", left: "44%", top: "40%", size: 18, opacity: 0.12, dur: 11, delay: -7 },
  { icon: "globe", left: "47%", top: "74%", size: 20, opacity: 0.16, dur: 7, delay: -1 },
  { icon: "shield", left: "52%", top: "16%", size: 22, opacity: 0.18, dur: 6, delay: -4 },
  { icon: "database", left: "55%", top: "89%", size: 18, opacity: 0.13, dur: 9, delay: -3 },
  { icon: "sparkles", left: "60%", top: "24%", size: 22, opacity: 0.18, dur: 7, delay: -5 },
  { icon: "layers", left: "64%", top: "78%", size: 18, opacity: 0.15, dur: 10, delay: -2 },
  { icon: "terminal", left: "69%", top: "11%", size: 24, opacity: 0.15, dur: 8, delay: -6 },
  { icon: "box", left: "73%", top: "87%", size: 20, opacity: 0.16, dur: 6, delay: -1 },
  { icon: "dashboard", left: "78%", top: "20%", size: 22, opacity: 0.15, dur: 9, delay: -4 },
  { icon: "award", left: "83%", top: "72%", size: 20, opacity: 0.16, dur: 7, delay: -3 },
  { icon: "medal", left: "87%", top: "13%", size: 22, opacity: 0.18, dur: 8, delay: -5 },
  { icon: "building", left: "91%", top: "62%", size: 22, opacity: 0.15, dur: 6, delay: -2 },
  { icon: "briefcase", left: "96%", top: "33%", size: 18, opacity: 0.13, dur: 10, delay: -7 },
  { icon: "search", left: "2%", top: "34%", size: 18, opacity: 0.12, dur: 9, delay: -2 },
  { icon: "star", left: "11%", top: "7%", size: 20, opacity: 0.15, dur: 7, delay: -5 },
  { icon: "heart", left: "19%", top: "64%", size: 18, opacity: 0.12, dur: 8, delay: -1 },
  { icon: "mail", left: "28%", top: "44%", size: 18, opacity: 0.11, dur: 11, delay: -6 },
  { icon: "phone", left: "37%", top: "58%", size: 16, opacity: 0.11, dur: 9, delay: -3 },
  { icon: "calendar", left: "46%", top: "6%", size: 18, opacity: 0.14, dur: 8, delay: -4 },
  { icon: "clock", left: "50%", top: "52%", size: 16, opacity: 0.11, dur: 10, delay: -2 },
  { icon: "check", left: "58%", top: "58%", size: 18, opacity: 0.12, dur: 7, delay: -5 },
  { icon: "wallet", left: "67%", top: "44%", size: 18, opacity: 0.11, dur: 9, delay: -1 },
  { icon: "bank", left: "75%", top: "54%", size: 20, opacity: 0.12, dur: 8, delay: -6 },
  { icon: "team", left: "83%", top: "40%", size: 18, opacity: 0.11, dur: 11, delay: -3 },
  { icon: "megaphone", left: "90%", top: "86%", size: 20, opacity: 0.14, dur: 7, delay: -4 },
  { icon: "analytics", left: "5%", top: "68%", size: 20, opacity: 0.14, dur: 10, delay: -6 },
  { icon: "activity", left: "33%", top: "32%", size: 16, opacity: 0.11, dur: 8, delay: -2 },
  { icon: "lock", left: "62%", top: "32%", size: 16, opacity: 0.11, dur: 9, delay: -5 },
  { icon: "message", left: "94%", top: "5%", size: 18, opacity: 0.12, dur: 8, delay: -1 },
];

function IconScatter() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {BG_ICONS.map((c, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: c.left,
            top: c.top,
            color: GOLD,
            opacity: c.opacity,
            animation: `cert-icon-float ${c.dur}s ease-in-out ${c.delay}s infinite`,
          }}
        >
          <AppIcon name={c.icon} size={c.size} />
        </span>
      ))}
    </div>
  );
}

/* ── Verification seal (rotating circular text, adapted from the hero's GuaranteeSeal) ── */
function VerificationSeal() {
  return (
    <svg
      width="190"
      height="190"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Digitally verifiable · 100% original certificate"
      className="pointer-events-none absolute"
      style={{ left: 56, bottom: 108 }}
    >
      {/* outer ring — navy */}
      <circle cx="100" cy="100" r="96" stroke={NAVY} strokeWidth="2.5" opacity={0.45} />
      {/* inner ring — gold */}
      <circle cx="100" cy="100" r="60" stroke={GOLD} strokeWidth="1.5" />

      {/* rotating circular text */}
      <g
        className="animate-[spin_26s_linear_infinite] motion-reduce:animate-none"
        style={{ transformBox: "view-box", transformOrigin: "100px 100px" }}
      >
        <defs>
          <path id="marwat-cert-seal-arc" d="M100 22 a78 78 0 1 1 -0.1 0" fill="none" />
        </defs>
        <text
          fill={GOLD_TEXT}
          className="font-mono uppercase"
          fontSize="13"
          fontWeight="600"
          letterSpacing="1.1"
          textLength="490"
          lengthAdjust="spacing"
        >
          <textPath href="#marwat-cert-seal-arc">
            Digitally verifiable · 100% original · marwattech.com.
          </textPath>
        </text>
      </g>

      {/* center mark — gold check */}
      <path
        d="M78 101 l14 16 l30 -36"
        stroke={GOLD}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Signature block ──────────────────────────────────────────────────── */
function SignatureBlock({ name, title, image }: { name: string; title: string; image?: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2" style={{ width: 250 }}>
        <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD} 50%, transparent)` }} />
        <span className="size-1.5 rotate-45" style={{ background: GOLD }} />
        <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD} 50%, transparent)` }} />
      </div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          className="max-h-14 w-auto object-contain"
          style={{ filter: "sepia(0.18) brightness(0.92) contrast(1.08)" }}
        />
      ) : (
        <p className="font-script-name text-2xl" style={{ color: GOLD }}>
          {name}
        </p>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: INK_SOFT }}>
        {title}
      </p>
    </div>
  );
}

/* ── Main certificate ─────────────────────────────────────────────────── */
export function CertificateView({ data }: { data: CertificateViewData }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DESIGN_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-resize the student name for long names.
  const n = data.studentName.length;
  const nameSize = n > 30 ? 52 : n > 22 ? 62 : 78;
  const courseTitleSize = data.courseTitle.length > 46 ? 26 : data.courseTitle.length > 30 ? 30 : 34;

  return (
    <div
      ref={wrapRef}
      className="cert-print-wrap relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/30"
      style={{ aspectRatio: `${DESIGN_W} / ${DESIGN_H}` }}
    >
      <div
        className="cert-print-scale absolute left-0 top-0"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: `linear-gradient(180deg, #FFFFFF 0%, #FDFCF5 100%)`,
          color: INK,
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        {/* gentle float keyframe for the scattered background icons */}
        <style>{`
          @keyframes cert-icon-float {
            0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(0deg); }
            50% { transform: translate(-50%, -50%) translateY(-10px) rotate(5deg); }
          }
        `}</style>

        {/* subtle night-mode square logo watermark in the background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logo-dark-square.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: "50%",
            top: "50%",
            width: 620,
            height: 620,
            transform: "translate(-50%, -50%)",
            opacity: 0.12,
            mixBlendMode: "multiply",
          }}
        />

        {/* scattered service icons in the background (like the CTA banner) */}
        <IconScatter />

        {/* clean gold frame */}
        <div
          className="pointer-events-none absolute rounded-[26px]"
          style={{ inset: 24, border: `1px solid ${NAVY}`, opacity: 0.4 }}
        />
        <div
          className="pointer-events-none absolute rounded-[30px]"
          style={{ inset: 28, border: `2px solid ${GOLD}` }}
        />
        <div
          className="pointer-events-none absolute rounded-[40px]"
          style={{ inset: 38, border: `1px solid ${GOLD}`, opacity: 0.5 }}
        />
        {/* small corner accents on the frame */}
        {[
          { x: 31, y: 31 },
          { x: 1383, y: 31 },
          { x: 31, y: 969 },
          { x: 1383, y: 969 },
        ].map((p, i) => (
          <span
            key={i}
            className="pointer-events-none absolute size-2 rotate-45"
            style={{ left: p.x - 4, top: p.y - 4, background: GOLD }}
          />
        ))}

        {/* award badge (top-left) + golden laurel (top-right) fill the header gap */}
        <img
          src="/assets/award-badge.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: 84, top: 46, width: 176, height: 176 }}
        />
        <img
          src="/assets/laurel.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{ right: 56, top: 34, width: 216, height: 216 }}
        />

        {/* ── central content ── */}
        <div className="absolute inset-x-0" style={{ top: 168 }}>
          {/* platform eyebrow */}
          <p
            className="text-center text-[15px] font-semibold uppercase tracking-[0.42em]"
            style={{ color: GOLD_TEXT }}
          >
            Marwat Tech Academy
          </p>

          {/* heading */}
          <h1
            className="text-center font-script font-normal leading-none"
            style={{ marginTop: 14, fontSize: 118, color: GOLD, textShadow: "0 2px 14px rgba(16,20,46,0.14)" }}
          >
            Certificate
          </h1>

          {/* OF COMPLETION with flourishes */}
          <div className="mt-1 flex items-center justify-center gap-4">
            <span className="h-[2px] w-16 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span className="size-2 rotate-45" style={{ background: GOLD }} />
            <p className="text-[26px] font-semibold uppercase tracking-[0.34em]" style={{ color: GOLD }}>
              Of Completion
            </p>
            <span className="size-2 rotate-45" style={{ background: GOLD }} />
            <span className="h-[2px] w-16 rounded-full" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
          </div>

          {/* presented to */}
          <p className="mt-6 text-center text-[15px] font-semibold uppercase tracking-[0.34em]" style={{ color: INK }}>
            This Certificate Is Presented To
          </p>

          {/* student name (script, auto-sized) */}
          <p
            className="text-center font-script-name leading-tight"
            style={{ marginTop: 12, fontSize: nameSize, color: GOLD, textShadow: "0 2px 10px rgba(16,20,46,0.16)" }}
          >
            {data.studentName}
          </p>

          {/* divider */}
          <div className="mx-auto flex items-center gap-3" style={{ marginTop: 20, width: 620 }}>
            <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span className="size-2 rotate-45" style={{ background: GOLD }} />
            <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
          </div>

          {/* for completing */}
          <p className="mt-6 text-center text-[16px]" style={{ color: INK }}>
            For successfully completing
          </p>
          <p
            className="mx-auto text-center font-bold leading-snug"
            style={{ marginTop: 6, maxWidth: 900, fontSize: courseTitleSize, color: GOLD }}
          >
            {data.courseTitle}
          </p>
          <p
            className="mx-auto mt-3 max-w-[820px] text-center text-[14px] leading-relaxed"
            style={{ color: INK_SOFT }}
          >
            This certificate is awarded in recognition of successfully completing the required
            lessons and learning activities of the course.
          </p>
        </div>

        {/* ── signatures ── */}
        <div className="absolute inset-x-0 flex items-start justify-center gap-40" style={{ top: 700 }}>
          <SignatureBlock
            name={data.directorName}
            title={data.directorTitle}
            image={data.directorSignatureImage}
          />
          <SignatureBlock
            name={data.instructorName}
            title={data.instructorTitle}
            image={data.instructorSignatureImage}
          />
        </div>

        {/* ── metadata ── */}
        <div className="absolute inset-x-0 text-center" style={{ top: 812 }}>
          <p className="text-[12.5px] font-medium tracking-[0.08em]" style={{ color: INK }}>
            Certificate No: <span style={{ color: GOLD_TEXT }}>{data.certificateNo}</span>
            <span style={{ opacity: 0.45 }}>  ·  </span>
            Issue Date: <span style={{ color: GOLD_TEXT }}>{formatDateLabel(data.issueDate)}</span>
            {data.courseDuration && (
              <>
                <span style={{ opacity: 0.45 }}>  ·  </span>
                Duration: <span style={{ color: GOLD_TEXT }}>{data.courseDuration}</span>
              </>
            )}
          </p>
        </div>

        {/* ── verification seal (bottom-left, rotating circular text) ── */}
        <VerificationSeal />

        {/* ── QR verification (bottom-right, above the border) ── */}
        <div className="absolute flex flex-col items-center gap-1.5" style={{ right: 54, bottom: 108 }}>
          <div
            className="grid place-items-center rounded-lg p-2.5 [&_svg]:h-full [&_svg]:w-full"
            style={{ width: 180, height: 180, background: WHITE, border: `2px solid ${GOLD}`, boxShadow: "0 4px 14px rgba(16,20,46,0.12)" }}
          >
            {data.qrSvg ? (
              <div
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: data.qrSvg }}
              />
            ) : (
              <span className="text-[10px] font-bold" style={{ color: INK }}>QR</span>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: GOLD_TEXT }}>
            Scan to verify
          </p>
        </div>

        {/* small footer mark */}
        <div className="absolute inset-x-0 text-center" style={{ bottom: 22 }}>
          <p className="text-[11px] tracking-[0.28em]" style={{ color: GOLD_TEXT }}>
            {data.verifyUrl.replace("https://", "")}
          </p>
        </div>
      </div>
    </div>
  );
}
