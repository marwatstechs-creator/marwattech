import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center shadow-lg sm:px-12">
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
              <Button
                size="lg"
                variant="gold"
                className="font-semibold"
              >
                Get a Free Mockup
                <AppIcon name="arrowUpRight" size={16} />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent font-semibold text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                Contact Us
              </Button>
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
