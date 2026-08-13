"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppIcon } from "@/components/app-icon";
import { Typewriter } from "@/components/marketing/typewriter";
import { trackEvent } from "@/lib/analytics";

/* ── Dot Grid Canvas ────────────────────────────────────────────────── */

function DotGrid() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0.5, y: 0.5 });

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const draw = React.useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const p = c.parentElement!; const w = p.clientWidth; const h = p.clientHeight;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = `${w}px`; c.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const s = 22;
    for (let x = s; x < w; x += s) {
      for (let y = s; y < h; y += s) {
        const dx = x / w - pos.x, dy = y / h - pos.y;
        const a = Math.max(0.05, (1 - Math.sqrt(dx*dx+dy*dy) / 0.5) * 0.28);
        ctx.fillStyle = `rgba(116,100,198,${a})`;
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill();
      }
    }
  }, [pos]);

  React.useEffect(() => { draw(); }, [draw]);
  React.useEffect(() => {
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{ maskImage: "radial-gradient(ellipse at center, black 55%, transparent 95%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 55%, transparent 95%)" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

/* ── Floating Testimonial Card ──────────────────────────────────────── */

function FloatCard({ quote, name, deg }: { quote: string; name: string; deg: number }) {
  return (
    <div style={{ transform: `rotate(${deg}deg)` }}>
      <article className="pointer-events-auto w-full rounded-4xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs leading-relaxed text-foreground/70">&ldquo;{quote}&rdquo;</p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground/30">
            <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>
          </svg>
        </div>
        <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground/40">&ndash; {name}</p>
      </article>
    </div>
  );
}

/* ── Trust Badge ────────────────────────────────────────────────────── */

function TrustBadge({ icon, rating, label }: { icon: "trustpilot" | "google" | "g2"; rating: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon === "trustpilot" && (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" fill="#7464c6" stroke="none"/>
        </svg>
      )}
      {icon === "google" && (
        <svg width="30" height="30" viewBox="0 0 48 48" className="shrink-0">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
      )}
      {icon === "g2" && (
        <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0">
          <circle cx="16" cy="16" r="16" fill="#FF492C"/>
          <text x="16" y="21" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="14" fill="#fff">G2</text>
        </svg>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <AppIcon key={i} name="star" size={14} color="#7464c6" />
          ))}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground/70">{rating} {label}</span>
      </div>
    </div>
  );
}

/* ── Animated Arrow CTA ─────────────────────────────────────────────── */

function ArrowButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={() => trackEvent("cta_click", { cta: "hero_primary" })}>
      <span className="btn-3d group min-h-[64px] rounded-full pl-6 pr-2.5">
        <span className="min-w-0 flex-1">{children}</span>
        <span className="relative inline-flex h-9 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-foreground/15">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </span>
      </span>
    </Link>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────── */

export function Hero() {
  return (
    <section className="relative isolate w-full overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-28 lg:pb-32 lg:pt-36">
      <DotGrid />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Left floating cards - xl only */}
          <div className="pointer-events-none hidden xl:flex absolute inset-y-0 z-0 w-[260px] items-center overflow-hidden left-0 justify-start">
            <div className="flex w-[260px] flex-col gap-6 py-8 pl-2">
              <FloatCard deg={4} quote="Marwat Tech delivered our website on time, within budget. Professional team, great communication." name="Abdullah Khan" />
              <FloatCard deg={0} quote="Excellent service! They built our e-commerce site exactly how we wanted. Highly recommended." name="Muhammad Ali" />
              <FloatCard deg={-4} quote="They helped us with SEO and website redesign. Traffic increased significantly within weeks." name="Bilal Hussain" />
            </div>
          </div>

          {/* Right floating cards - xl only */}
          <div className="pointer-events-none hidden xl:flex absolute inset-y-0 z-0 w-[260px] items-center overflow-hidden right-0 justify-end">
            <div className="flex w-[260px] flex-col gap-6 py-8 pr-2">
              <FloatCard deg={-4} quote="Professional, responsive and technically excellent. The app was approved on first submission." name="Usman Farooq" />
              <FloatCard deg={0} quote="From mockup to launch in three weeks. A smooth process that brings us real leads." name="Hassan Raza" />
              <FloatCard deg={4} quote="The free mockup impressed us immediately — we knew we were in good hands." name="Ayesha Malik" />
            </div>
          </div>

          {/* Gradient overlays on sides */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-background/50 via-transparent to-background/50 hidden xl:block" />

          {/* Center content */}
          <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center gap-8 lg:gap-12">
            {/* Badge with pulsing dot */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-card px-5 py-2 text-xs font-semibold tracking-widest uppercase text-foreground/60 ring-1 ring-primary/30 shadow-[0_0_18px_0] shadow-primary/15">
                <span className="size-[7px] shrink-0 rounded-full bg-primary animate-pulse" />
                TOP RATED · TRUSTED BY 100+ CLIENTS
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-center text-5xl font-extrabold tracking-tight sm:text-[56px] sm:leading-[1.05] lg:text-[72px] lg:leading-[1.07]">
              <span className="block">We Build</span>
              <span className="block bg-gradient-to-r from-[#7464c6] via-[#f8c640] to-[#9b8dd4] bg-clip-text text-transparent sm:mt-2">Digital Products</span>
              <span className="block sm:mt-2">
                That Drive <Typewriter />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden max-w-[640px] text-center text-lg leading-relaxed text-foreground/60 md:block">
              Every project is built by vetted experts. From websites and mobile apps to SEO and AI — we deliver quality, on time, at competitive rates.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex w-full max-w-[280px] flex-col items-center gap-3 md:max-w-none md:flex-row md:justify-center">
              <ArrowButton href="/contact">Get Started</ArrowButton>
              <Link href="/portfolio">
                <span className="btn-3d-outline group min-h-[64px] rounded-full pl-6 pr-2.5">
                  View Portfolio
                  <span className="relative inline-flex h-9 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground/5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </span>
                </span>
              </Link>
            </motion.div>

            {/* Developer CTA */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center gap-1.5 md:flex-row md:gap-2">
              <span className="text-xs font-medium text-foreground/50">Are you a client?</span>
              <Link href="/client/login" className="border-b border-dashed border-foreground/30 pb-0.5 text-xs font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary">
                Login to your dashboard
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center justify-center gap-6">
              <TrustBadge icon="google" rating="4.7" label="from 6 reviews" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
