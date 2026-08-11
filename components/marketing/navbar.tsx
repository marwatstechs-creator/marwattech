"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Logo } from "@/components/marketing/logo";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

/* ── Theme Toggle ──────────────────────────────────────────────────── */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-8 rounded-lg" />;
  return (
    <button type="button" aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid size-8 place-items-center rounded-lg text-foreground/50 hover:bg-accent-hover hover:text-foreground transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="hidden dark:block">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="block dark:hidden">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
      </svg>
    </button>
  );
}

/* ── Mega Menu Item ─────────────────────────────────────────────────── */

function MegaItem({ icon, title, desc, href }: { icon: React.ReactNode; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="group flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-start transition-colors hover:bg-accent-hover">
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border bg-card text-foreground/50 transition-all duration-200 ease-out group-hover:-translate-y-[3px] group-hover:border-primary group-hover:text-primary group-hover:shadow-[0_8px_14px_-6px_rgba(116,100,198,0.35)]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{desc}</span>
      </span>
    </Link>
  );
}

/* ── Arrow Button ───────────────────────────────────────────────────── */

function ArrowBtn({ href, children, variant, showArrow = true }: { href: string; children: React.ReactNode; variant: "gold" | "purple" | "outline"; showArrow?: boolean }) {
  const colorMap = {
    gold: "btn-3d-gold",
    purple: "btn-3d",
    outline: "btn-3d-outline",
  };
  const circleMap = {
    gold: "bg-black/10",
    purple: "bg-primary-foreground/15",
    outline: "bg-foreground/5",
  };
  return (
    <Link href={href} onClick={() => trackEvent("cta_click", { cta: href })}>
      <span className={cn("group inline-flex h-9 items-center gap-2 overflow-hidden rounded-full text-sm font-semibold transition-all", showArrow ? "pl-4 pr-1.5" : "px-4", colorMap[variant])}>
        {children}
        {showArrow && (
          <span className={cn("relative inline-flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full", circleMap[variant])}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        )}
      </span>
    </Link>
  );
}

/* ── MEGA MENU DATA ─────────────────────────────────────────────────── */

const MEGA_MENU = {
  featured: {
    badge: "For the best experience",
    icon: <AppIcon name="rocket" size={20} />,
    title: "Start Your Project",
    desc: "Tell us what you need. We'll plan it with you and match you with the right team from our top talent.",
    cta: "Get a Free Quote",
    href: "/contact",
  },
  columns: [
    {
      label: "Services",
      items: [
        { icon: <AppIcon name="code" size={17} />, title: "Web Development", desc: "Custom websites & web apps", href: "/services/web-development" },
        { icon: <AppIcon name="mobile" size={17} />, title: "Mobile Apps", desc: "iOS & Android development", href: "/services/mobile-apps" },
        { icon: <AppIcon name="ecommerce" size={17} />, title: "E-Commerce", desc: "Online stores that convert", href: "/services/ecommerce" },
      ],
    },
    {
      label: "Solutions",
      items: [
        { icon: <AppIcon name="seo" size={17} />, title: "SEO Services", desc: "Rank higher, get more traffic", href: "/services/seo" },
        { icon: <AppIcon name="ai" size={17} />, title: "AI Solutions", desc: "Automation & intelligence", href: "/services/ai-solutions" },
        { icon: <AppIcon name="design" size={17} />, title: "UI/UX Design", desc: "Beautiful, usable interfaces", href: "/services/ui-ux-design" },
      ],
    },
    {
      label: "Company",
      items: [
        { icon: <AppIcon name="grid" size={17} />, title: "Portfolio", desc: "Our recent work", href: "/portfolio" },
        { icon: <AppIcon name="chat" size={17} />, title: "Testimonials", desc: "What clients say", href: "/testimonials" },
        { icon: <AppIcon name="file" size={17} />, title: "Blog", desc: "Insights & guides", href: "/blog" },
      ],
    },
  ],
};

/* ── Navbar ────────────────────────────────────────────────────────── */

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = React.useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ── Notification Bar ────────────────────────────────── */}
      <div className="relative z-50 border-b border-[#f8c640]/20 bg-[#f8c640]/8 px-4 py-2 text-center text-xs sm:text-sm backdrop-blur-sm">
        <span className="text-foreground/70">Try risk-free — Money-back guaranteed.{" "}</span>
        <Link href="/contact" className="inline-flex items-center gap-1 font-semibold text-[#f8c640] hover:underline whitespace-nowrap">
          Start free trial <AppIcon name="arrowRight" size={13} />
        </Link>
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <header ref={navRef} className={cn("sticky top-0 z-40 w-full py-2 transition-colors sm:py-3", scrolled ? "bg-background/70 backdrop-blur-md" : "bg-transparent")}>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between gap-3 rounded-full border bg-background/80 px-5 py-2 shadow-sm backdrop-blur-xl transition-all">
            <Logo />

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex">
              {/* Explore mega menu trigger */}
              <div className="relative"
                onMouseEnter={() => { clearTimeout(closeTimer.current); setMegaOpen(true); }}
                onMouseLeave={() => { closeTimer.current = setTimeout(() => setMegaOpen(false), 200); }}>
                <button
                  className={cn("inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors", megaOpen ? "text-foreground" : "text-foreground/60 hover:text-foreground")}>
                  Explore
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    className={cn("transition-transform duration-200", megaOpen && "rotate-180")}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {/* Mega dropdown */}
                <div
                  onMouseEnter={() => { clearTimeout(closeTimer.current); setMegaOpen(true); }}
                  onMouseLeave={() => { closeTimer.current = setTimeout(() => setMegaOpen(false), 200); }}
                  className={cn("pointer-events-none absolute left-0 top-full z-50 pt-2 transition-all duration-200", megaOpen ? "pointer-events-auto visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0")}>
                  <div className="flex w-[560px] lg:w-[900px] max-w-[calc(100vw-2rem)] items-stretch gap-2.5 rounded-4xl border bg-popover p-3 shadow-lg">
                    {/* Featured card - hidden on small screens */}
                    <div className="hidden lg:flex flex-col rounded-2xl bg-accent/30 w-[250px] shrink-0 p-5">
                      <span className="self-start rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase text-primary-foreground">{MEGA_MENU.featured.badge}</span>
                      <span className="mt-3 flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                        <span className="text-primary">{MEGA_MENU.featured.icon}</span>
                        {MEGA_MENU.featured.title}
                      </span>
                      <p className="mt-1.5 text-sm text-muted-foreground mb-6">{MEGA_MENU.featured.desc}</p>
                      <Link href={MEGA_MENU.featured.href} onClick={() => setMegaOpen(false)} className="group mt-auto inline-flex items-center justify-between rounded-full btn-3d pb-1.5 pl-5 pr-1.5 pt-1.5 text-sm font-medium">
                        {MEGA_MENU.featured.cta}
                        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-foreground/15">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                          </svg>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                          </svg>
                        </span>
                      </Link>
                    </div>

                    {/* Menu columns */}
                    <div className="grid flex-1 grid-cols-3">
                      {MEGA_MENU.columns.map((col) => (
                        <div key={col.label} className="flex min-w-0 flex-col gap-1 border-l py-1 pe-1 ps-3">
                          <span className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                          {col.items.map((item) => (
                            <div key={item.href} onClick={() => setMegaOpen(false)}>
                              <MegaItem icon={item.icon} title={item.title} desc={item.desc} href={item.href} />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regular nav links */}
              {(
                [
                  { label: "Portfolio", href: "/portfolio", icon: "grid" },
                  { label: "Testimonials", href: "/testimonials", icon: "chat" },
                  { label: "Blog", href: "/blog", icon: "file" },
                  { label: "Contact", href: "/contact", icon: "mail" },
                ] as const
              ).map((item) => (
                <Link key={item.href} href={item.href}
                  className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors", isActive(item.href) ? "text-foreground" : "text-foreground/60 hover:text-foreground")}>
                  {item.href === "/portfolio" ? (
                    <span className="inline-flex shrink-0">
                      <img src="/assets/logo-light-square.svg" alt="" className="h-4 w-4 dark:hidden" />
                      <img src="/assets/logo-dark-square.svg" alt="" className="hidden h-4 w-4 dark:block" />
                    </span>
                  ) : (
                    <AppIcon name={item.icon} size={15} />
                  )}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              <div className="hidden items-center gap-1.5 lg:flex">
                <ThemeToggle />
                <ArrowBtn href="/client/register" variant="outline" showArrow={false}><AppIcon name="userAdd" size={14} /> Sign Up</ArrowBtn>
                <ArrowBtn href="/client/login" variant="outline" showArrow={false}><AppIcon name="login" size={14} /> Login</ArrowBtn>
                <ArrowBtn href="/contact" variant="gold">Get Started</ArrowBtn>
              </div>
              <button type="button" className="grid size-9 place-items-center rounded-full border bg-background lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative ml-auto mr-4 mt-[84px] flex max-h-[calc(100%-102px)] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-3xl border bg-popover shadow-2xl outline-none sm:mr-6"
            >
              {/* Close button */}
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border hover:bg-accent-hover z-10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>

              {/* Scrollable nav */}
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-2 pt-4">
                <ul className="flex flex-col gap-1">
                  {/* Explore (mobile) */}
                  <li className="flex flex-col">
                    <button className="group flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-start text-base font-semibold text-foreground/70 transition-colors hover:bg-accent-hover hover:text-foreground"
                      onClick={() => setMobileExploreOpen((v) => !v)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                      </svg>
                      <span className="flex-1 text-start transition-transform duration-200 group-hover:translate-x-[3px]">Explore</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cn("shrink-0 text-muted-foreground transition-transform duration-200", mobileExploreOpen && "rotate-180")}><path d="m6 9 6 6 6-6"/></svg>
                    </button>

                    <AnimatePresence initial={false}>
                      {mobileExploreOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 flex flex-col gap-1 rounded-2xl border bg-accent/20 p-2">
                            <Link href={MEGA_MENU.featured.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl bg-primary p-3 text-sm font-semibold text-primary-foreground">
                              <span className="text-lg">{MEGA_MENU.featured.icon}</span>
                              <span className="flex-1">{MEGA_MENU.featured.title}</span>
                              <AppIcon name="arrowRight" size={16} />
                            </Link>
                            {MEGA_MENU.columns.map((col) => (
                              <div key={col.label} className="flex flex-col gap-0.5">
                                <span className="px-2 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                                {col.items.map((item) => (
                                  <div key={item.href} onClick={() => setMobileOpen(false)}>
                                    <MegaItem icon={item.icon} title={item.title} desc={item.desc} href={item.href} />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Nav items with icons */}
                  {[
                    { label: "Portfolio", href: "/portfolio", icon: <path d="M4 18V7l5 7 3-4 3 4 5-7v11"/> },
                    { label: "Testimonials", href: "/testimonials", icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 12a2 2 0 0 0 2-2V8H8"/><path d="M14 12a2 2 0 0 0 2-2V8h-2"/></> },
                    { label: "Blog", href: "/blog", icon: <path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/> },
                    { label: "Contact", href: "/contact", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></> },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setMobileOpen(false)}
                        className="group flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-start text-base font-semibold text-foreground/70 transition-colors hover:bg-accent-hover hover:text-foreground">
                        {item.href === "/portfolio" ? (
                          <span className="grid size-[18px] shrink-0 place-items-center">
                            <img src="/assets/logo-light-square.svg" alt="" className="h-[18px] w-[18px] dark:hidden" />
                            <img src="/assets/logo-dark-square.svg" alt="" className="hidden h-[18px] w-[18px] dark:block" />
                          </span>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                            {item.icon}
                          </svg>
                        )}
                        <span className="flex-1 text-start transition-transform duration-200 group-hover:translate-x-[3px]">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Featured card */}
                <div className="mb-1 mt-2 px-1">
                  <div className="flex flex-col rounded-2xl bg-accent/30 p-4">
                    <span className="self-start rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase text-primary-foreground">For the best experience</span>
                    <span className="mt-3 flex items-center gap-2 text-base font-bold tracking-tight">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                      </svg>
                      Start Your Project
                    </span>
                    <p className="mt-1.5 text-xs text-muted-foreground">Tell us what you need. We'll plan it and match you with the right team.</p>
                    <Link href="/contact" onClick={() => setMobileOpen(false)}
                      className="group mt-4 flex items-center justify-between rounded-full bg-primary py-1 pl-4 pr-1 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
                      Get a Free Quote
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-foreground/15">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                        </svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                        </svg>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Preferences row */}
              <div className="flex flex-none items-center justify-between border-t px-4 pb-1 pt-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preferences</span>
                <ThemeToggle />
              </div>

              {/* CTA buttons */}
              <div className="flex flex-none gap-2.5 p-3">
                <Link href="/client/register" onClick={() => setMobileOpen(false)}
                  className="btn-3d-outline inline-flex h-11 flex-1 items-center justify-center rounded-full text-sm font-semibold">
                  <AppIcon name="userAdd" size={16} />
                  Sign Up
                </Link>
                <Link href="/client/login" onClick={() => setMobileOpen(false)}
                  className="btn-3d-outline inline-flex h-11 flex-1 items-center justify-center rounded-full text-sm font-semibold">
                  <AppIcon name="login" size={16} />
                  Login
                </Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)}
                  className="btn-3d-gold group inline-flex h-[52px] flex-[1.4] items-center justify-between overflow-hidden rounded-full pl-6 pr-2.5 text-base font-semibold text-black">
                  Get Started
                  <span className="relative inline-flex h-9 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
