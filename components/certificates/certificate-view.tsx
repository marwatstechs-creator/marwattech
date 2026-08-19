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

/* ── Scattered service icons (like the CTA banner background) ────────── */
const BG_ICONS: {
  icon: IconName;
  left: string;
  top: string;
  size: number;
  opacity: number;
}[] = [
  { icon: "code", left: "5%", top: "16%", size: 20, opacity: 0.42 },
  { icon: "wordpress", left: "7%", top: "48%", size: 18, opacity: 0.34 },
  { icon: "ecommerce", left: "9%", top: "82%", size: 22, opacity: 0.32 },
  { icon: "seo", left: "14%", top: "24%", size: 18, opacity: 0.44 },
  { icon: "mobile", left: "19%", top: "90%", size: 20, opacity: 0.3 },
  { icon: "ai", left: "25%", top: "11%", size: 16, opacity: 0.36 },
  { icon: "design", left: "30%", top: "76%", size: 18, opacity: 0.34 },
  { icon: "rocket", left: "34%", top: "23%", size: 20, opacity: 0.44 },
  { icon: "target", left: "39%", top: "92%", size: 16, opacity: 0.3 },
  { icon: "chart", left: "44%", top: "13%", size: 20, opacity: 0.34 },
  { icon: "nextjs", left: "47%", top: "42%", size: 16, opacity: 0.26 },
  { icon: "globe", left: "50%", top: "72%", size: 18, opacity: 0.4 },
  { icon: "shield", left: "54%", top: "18%", size: 20, opacity: 0.44 },
  { icon: "database", left: "58%", top: "88%", size: 16, opacity: 0.32 },
  { icon: "sparkles", left: "63%", top: "26%", size: 20, opacity: 0.44 },
  { icon: "layers", left: "68%", top: "76%", size: 16, opacity: 0.3 },
  { icon: "terminal", left: "72%", top: "12%", size: 22, opacity: 0.34 },
  { icon: "box", left: "77%", top: "86%", size: 18, opacity: 0.36 },
  { icon: "dashboard", left: "81%", top: "22%", size: 20, opacity: 0.34 },
  { icon: "award", left: "85%", top: "70%", size: 18, opacity: 0.4 },
  { icon: "medal", left: "89%", top: "15%", size: 20, opacity: 0.44 },
  { icon: "building", left: "93%", top: "60%", size: 20, opacity: 0.34 },
  { icon: "briefcase", left: "96%", top: "34%", size: 16, opacity: 0.3 },
];

function IconScatter() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {BG_ICONS.map((c, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: c.left, top: c.top, color: GOLD, opacity: c.opacity }}
        >
          <AppIcon name={c.icon} size={c.size} />
        </span>
      ))}
    </div>
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
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/30"
      style={{ aspectRatio: `${DESIGN_W} / ${DESIGN_H}` }}
    >
      <div
        className="absolute left-0 top-0"
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

        {/* ── QR verification (bottom-right, above the border) ── */}
        <div className="absolute flex flex-col items-center gap-1" style={{ right: 54, bottom: 150 }}>
          <div
            className="grid place-items-center rounded-lg p-2 [&_svg]:h-full [&_svg]:w-full"
            style={{ width: 96, height: 96, background: WHITE, border: `1.5px solid ${GOLD}`, boxShadow: "0 4px 14px rgba(16,20,46,0.12)" }}
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
          <p className="text-[9.5px] font-bold uppercase tracking-[0.24em]" style={{ color: GOLD_TEXT }}>
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
