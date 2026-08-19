"use client";

import { useEffect, useRef, useState } from "react";

/* ── Palette (matches the navy + gold reference) ─────────────────────── */
const NAVY = "#07145C";
const NAVY_2 = "#0B1F78";
const NAVY_DARK = "#06134F";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F1D27A";
const GOLD_MET = "#E8C65A";
const WHITE = "#FFFFFF";
const MUTED = "#E9ECF5";

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

/* ── Decorative full-bleed waves (top / bottom / sides + dots) ───────── */
function DecorativeWaves() {
  return (
    <svg
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      fill="none"
      className="pointer-events-none absolute inset-0"
      aria-hidden
    >
      {/* gold dot pattern used inside some wave bands */}
      <defs>
        <pattern id="gold-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.6" fill={GOLD_LIGHT} opacity="0.85" />
        </pattern>
      </defs>

      {/* ── TOP WAVES ── */}
      <path
        d="M0 150 C170 78 340 190 520 118 C700 46 880 178 1060 108 C1240 38 1330 118 1414 88 L1414 0 L0 0 Z"
        fill={NAVY_DARK}
      />
      <path
        d="M0 112 C180 46 360 158 540 88 C720 18 900 150 1080 80 C1260 10 1360 90 1414 60 L1414 0 L0 0 Z"
        fill={NAVY_2}
      />
      <path
        d="M0 74 C200 14 400 116 580 54 C760 -8 940 104 1120 44 C1300 -16 1380 62 1414 32 L1414 0 L0 0 Z"
        fill={GOLD}
      />
      {/* gold light accent line under the top gold ribbon */}
      <path
        d="M0 84 C200 24 400 126 580 64 C760 2 940 114 1120 54 C1300 -6 1380 72 1414 42"
        stroke={GOLD_LIGHT}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* dotted band along the second navy wave */}
      <path
        d="M0 108 C180 42 360 154 540 84 C720 14 900 146 1080 76 C1260 6 1360 86 1414 56 L1414 64 C1360 94 1260 14 1080 84 C900 154 720 22 540 92 C360 162 180 50 0 116 Z"
        fill="url(#gold-dots)"
        opacity="0.7"
      />

      {/* ── BOTTOM WAVES (mirrored) ── */}
      <path
        d="M0 850 C170 922 340 810 520 882 C700 954 880 822 1060 892 C1240 962 1330 882 1414 912 L1414 1000 L0 1000 Z"
        fill={NAVY_DARK}
      />
      <path
        d="M0 888 C180 954 360 842 540 912 C720 982 900 850 1080 920 C1260 990 1360 910 1414 940 L1414 1000 L0 1000 Z"
        fill={NAVY_2}
      />
      <path
        d="M0 926 C200 986 400 884 580 946 C760 1008 940 896 1120 956 C1300 1016 1380 938 1414 968 L1414 1000 L0 1000 Z"
        fill={GOLD}
      />
      <path
        d="M0 916 C200 976 400 874 580 936 C760 998 940 886 1120 946 C1300 1006 1380 928 1414 958"
        stroke={GOLD_LIGHT}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M0 892 C180 958 360 846 540 916 C720 986 900 854 1080 924 C1260 994 1360 914 1414 944 L1414 936 C1360 906 1260 986 1080 916 C900 846 720 978 540 908 C360 838 180 950 0 884 Z"
        fill="url(#gold-dots)"
        opacity="0.7"
      />

      {/* ── LEFT RIBBON ── */}
      <path
        d="M0 260 C60 300 96 420 64 560 C40 660 70 800 46 920 L0 1000 L0 260 Z"
        fill={GOLD}
      />
      <path
        d="M0 300 C44 340 74 440 48 570 C28 660 52 790 32 910 L0 940 L0 300 Z"
        fill={GOLD_LIGHT}
        opacity="0.85"
      />
      <path
        d="M0 180 C70 220 118 340 90 480 C70 590 96 720 74 840 L0 820 Z"
        fill={NAVY_2}
        opacity="0.9"
      />

      {/* ── RIGHT RIBBON ── */}
      <path
        d="M1414 260 C1354 300 1318 420 1350 560 C1374 660 1344 800 1368 920 L1414 1000 L1414 260 Z"
        fill={GOLD}
      />
      <path
        d="M1414 300 C1370 340 1340 440 1366 570 C1386 660 1362 790 1382 910 L1414 940 L1414 300 Z"
        fill={GOLD_LIGHT}
        opacity="0.85"
      />
      <path
        d="M1414 180 C1344 220 1296 340 1324 480 C1344 590 1318 720 1340 840 L1414 820 Z"
        fill={NAVY_2}
        opacity="0.9"
      />
    </svg>
  );
}

/* ── Gold graduation badge (top-left) ─────────────────────────────────── */
function GraduationBadge() {
  return (
    <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden>
      {/* outer rings */}
      <circle cx="110" cy="110" r="103" fill="none" stroke={GOLD} strokeWidth="4" />
      <circle cx="110" cy="110" r="93" fill="none" stroke={GOLD_LIGHT} strokeWidth="1.5" strokeDasharray="7 6" />
      <circle cx="110" cy="110" r="83" fill={NAVY} stroke={GOLD} strokeWidth="2.5" />
      <circle cx="110" cy="110" r="75" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.6" />

      {/* ribbon tails */}
      <path d="M86 172 L72 208 L98 194 Z" fill={GOLD_MET} />
      <path d="M134 172 L148 208 L122 194 Z" fill={GOLD} />
      <circle cx="74" cy="206" r="3.5" fill={GOLD_LIGHT} />
      <circle cx="146" cy="206" r="3.5" fill={GOLD_LIGHT} />

      {/* laurel wreath (left + right leaves) */}
      <g fill={GOLD}>
        <ellipse cx="56" cy="96" rx="6" ry="14" transform="rotate(26 56 96)" />
        <ellipse cx="62" cy="66" rx="6" ry="14" transform="rotate(52 62 66)" />
        <ellipse cx="76" cy="42" rx="6" ry="14" transform="rotate(78 76 42)" />
        <ellipse cx="164" cy="96" rx="6" ry="14" transform="rotate(-26 164 96)" />
        <ellipse cx="158" cy="66" rx="6" ry="14" transform="rotate(-52 158 66)" />
        <ellipse cx="144" cy="42" rx="6" ry="14" transform="rotate(-78 144 42)" />
      </g>
      {/* wreath stems */}
      <path d="M64 126 C72 148 148 148 156 126" fill="none" stroke={GOLD} strokeWidth="2.5" opacity="0.8" />

      {/* mortarboard */}
      <path d="M110 78 L150 92 L110 106 L70 92 Z" fill={GOLD_LIGHT} />
      <path d="M70 92 L70 112 Q70 124 110 128 Q150 124 150 112 L150 92" fill="none" stroke={GOLD} strokeWidth="3" />
      <path d="M110 106 L110 132" stroke={GOLD} strokeWidth="3" />
      <circle cx="110" cy="136" r="5" fill={GOLD} />
      <path d="M150 92 L162 88" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />

      {/* small stars */}
      <path
        d="M110 40 l4 8 8.8 1.3 -6.4 6.2 1.5 8.8 -7.9 -4.2 -7.9 4.2 1.5 -8.8 -6.4 -6.2 8.8 -1.3 Z"
        fill={GOLD_LIGHT}
      />
      <path d="M50 66 l2.6 5.2 5.8 0.9 -4.2 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.2 -4.1 5.8 -0.9 Z" fill={GOLD} />
      <path d="M170 66 l2.6 5.2 5.8 0.9 -4.2 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.2 -4.1 5.8 -0.9 Z" fill={GOLD} />
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
          style={{ filter: "sepia(0.4) saturate(1.4) brightness(1.05)" }}
        />
      ) : (
        <p className="font-script-name text-2xl" style={{ color: GOLD_LIGHT }}>
          {name}
        </p>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MUTED }}>
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
          background: `linear-gradient(180deg, ${NAVY_2} 0%, ${NAVY} 52%, ${NAVY_DARK} 100%)`,
          color: WHITE,
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        <DecorativeWaves />

        {/* gold inner frame */}
        <div
          className="pointer-events-none absolute rounded-[28px]"
          style={{ inset: 26, border: `2px solid ${GOLD}` }}
        />
        <div
          className="pointer-events-none absolute rounded-[38px]"
          style={{ inset: 34, border: `1px solid ${GOLD}`, opacity: 0.55 }}
        />
        {/* corner diamonds on the frame */}
        {[
          { x: 40, y: 40 },
          { x: 1374, y: 40 },
          { x: 40, y: 960 },
          { x: 1374, y: 960 },
        ].map((p, i) => (
          <span
            key={i}
            className="pointer-events-none absolute size-3 rotate-45"
            style={{ left: p.x - 6, top: p.y - 6, background: GOLD, boxShadow: `0 0 12px ${GOLD}` }}
          />
        ))}

        {/* top-left badge */}
        <div className="absolute" style={{ left: 46, top: 44, width: 218, height: 218 }}>
          <GraduationBadge />
        </div>

        {/* ── central content ── */}
        <div className="absolute inset-x-0" style={{ top: 130 }}>
          {/* platform eyebrow */}
          <p
            className="text-center text-[15px] font-semibold uppercase tracking-[0.42em]"
            style={{ color: GOLD_LIGHT }}
          >
            Marwat Tech Academy
          </p>

          {/* heading */}
          <h1
            className="text-center font-script font-normal leading-none"
            style={{ marginTop: 14, fontSize: 118, color: GOLD, textShadow: `0 2px 14px rgba(0,0,0,0.35)` }}
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
          <p className="mt-6 text-center text-[15px] font-semibold uppercase tracking-[0.34em]" style={{ color: MUTED }}>
            This Certificate Is Presented To
          </p>

          {/* student name (script, auto-sized) */}
          <p
            className="text-center font-script-name leading-tight"
            style={{ marginTop: 12, fontSize: nameSize, color: GOLD_LIGHT, textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
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
          <p className="mt-6 text-center text-[16px]" style={{ color: MUTED }}>
            For successfully completing
          </p>
          <p
            className="mx-auto text-center font-bold leading-snug"
            style={{ marginTop: 6, maxWidth: 900, fontSize: courseTitleSize, color: GOLD_LIGHT }}
          >
            {data.courseTitle}
          </p>
          <p
            className="mx-auto mt-3 max-w-[820px] text-center text-[14px] leading-relaxed"
            style={{ color: MUTED }}
          >
            This certificate is awarded in recognition of successfully completing the required
            lessons and learning activities of the course.
          </p>
        </div>

        {/* ── signatures ── */}
        <div className="absolute inset-x-0 flex items-start justify-center gap-40" style={{ top: 786 }}>
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
        <div className="absolute inset-x-0 text-center" style={{ top: 906 }}>
          <p className="text-[12.5px] font-medium tracking-[0.08em]" style={{ color: MUTED }}>
            Certificate No: <span style={{ color: GOLD_LIGHT }}>{data.certificateNo}</span>
            <span style={{ opacity: 0.6 }}>  ·  </span>
            Issue Date: <span style={{ color: GOLD_LIGHT }}>{formatDateLabel(data.issueDate)}</span>
            {data.courseDuration && (
              <>
                <span style={{ opacity: 0.6 }}>  ·  </span>
                Duration: <span style={{ color: GOLD_LIGHT }}>{data.courseDuration}</span>
              </>
            )}
          </p>
        </div>

        {/* ── QR verification (bottom-right) ── */}
        <div className="absolute flex flex-col items-center gap-1" style={{ right: 54, bottom: 60 }}>
          <div
            className="grid place-items-center rounded-lg bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
            style={{ width: 96, height: 96, boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }}
          >
            {data.qrSvg ? (
              <div
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: data.qrSvg }}
              />
            ) : (
              <span className="text-[10px] font-bold text-black">QR</span>
            )}
          </div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.24em]" style={{ color: GOLD_LIGHT }}>
            Scan to verify
          </p>
        </div>

        {/* small footer mark */}
        <div className="absolute inset-x-0 text-center" style={{ bottom: 22 }}>
          <p className="text-[11px] tracking-[0.28em]" style={{ color: GOLD, opacity: 0.8 }}>
            {data.verifyUrl.replace("https://", "")}
          </p>
        </div>
      </div>
    </div>
  );
}
