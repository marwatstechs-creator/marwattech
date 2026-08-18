"use client";

/* Dependency-free SVG charts that follow the design tokens (CSS variables),
 * so they adapt automatically to light/dark mode. */

import { useId } from "react";

function useToken(token: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return v || fallback;
}

/* ── Vertical bar chart ─────────────────────────────────────────── */

export function BarChart({
  data,
  height = 200,
  formatValue = (v: number) => String(v),
  className,
}: {
  data: { label: string; value: number }[];
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const gradId = useId();
  const primary = useToken("--color-primary", "#e11d48");
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 600;
  const h = height;
  const pad = 8;
  const inner = h - 24;
  const plotW = w - pad * 2;
  const slot = plotW / Math.max(1, data.length);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label="Bar chart"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="0.85" />
            <stop offset="100%" stopColor={primary} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {/* horizontal gridlines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={pad}
            x2={w - pad}
            y1={h - 22 - inner * f}
            y2={h - 22 - inner * f}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeDasharray="4 4"
          />
        ))}
        {data.map((d, i) => {
          const barH = (d.value / max) * inner;
          const bx = pad + i * slot + slot * 0.15;
          const bwid = slot * 0.7;
          return (
            <g key={i}>
              <rect x={bx} y={h - 22 - barH} width={bwid} height={barH} rx={4} fill={`url(#${gradId})`} />
              <text
                x={bx + bwid / 2}
                y={h - 8}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.6}
              >
                {d.label}
              </text>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Sparkline (small trend line) ───────────────────────────────── */

export function Sparkline({
  data,
  height = 36,
  className,
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  const gradId = useId();
  const primary = useToken("--color-primary", "#e11d48");
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = height;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 4 - ((v - min) / range) * (h - 8);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `${pts} ${w},${h} 0,${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="0.25" />
          <stop offset="100%" stopColor={primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Donut (proportions) ────────────────────────────────────────── */

export function DonutChart({
  segments,
  size = 140,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s, i) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              >
                <title>{`${s.label}: ${s.value}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        {centerValue !== undefined && (
          <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize={20} fontWeight={700} fill="currentColor">
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="currentColor" fillOpacity={0.6}>
            {centerLabel}
          </text>
        )}
      </svg>
      {segments.length > 0 && (
        <ul className="min-w-0 space-y-1.5 text-sm">
          {segments.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 truncate text-muted-foreground">{s.label}</span>
              <span className="font-medium">{s.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
