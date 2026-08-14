import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { ConstellationBackground } from "@/components/marketing/constellation-background";
import { SITE } from "@/lib/constants";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center shadow-lg sm:px-12">
        <ConstellationBackground className="text-primary-foreground" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,255,255,0.14),transparent)]"
        />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to bring your project to life?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Tell us about your idea and get a free quote, or a free homepage
            mockup — no obligation. Our team typically replies within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/free-mockup">
              <span className="btn-3d-gold group min-h-[64px] justify-between rounded-full pl-6 pr-2.5">
                <span className="min-w-0">Get a Free Mockup</span>
                <span className="relative inline-flex h-9 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </span>
            </Link>
            <Link href="/contact">
              <span className="btn-3d-outline-light group min-h-[64px] justify-between rounded-full pl-6 pr-2.5">
                <span className="min-w-0">Contact Us</span>
                <span className="relative inline-flex h-9 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="transition-transform duration-300 ease-out group-hover:translate-x-[220%]">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="absolute inset-0 m-auto -translate-x-[220%] transition-transform duration-300 ease-out group-hover:translate-x-0">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </span>
            </Link>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/70">
            Prefer email?{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="font-medium underline underline-offset-4"
            >
              {SITE.email}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
