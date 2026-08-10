import Link from "next/link";

import { Logo } from "@/components/marketing/logo";
import { AppIcon } from "@/components/app-icon";
import { SERVICES, LEGAL_LINKS, SITE } from "@/lib/constants";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

const SOCIALS: { label: string; icon: IconName; href: string }[] = [
  { label: "Facebook", icon: "facebook", href: SITE.social.facebook },
  { label: "Twitter / X", icon: "twitter", href: SITE.social.twitter },
  { label: "LinkedIn", icon: "linkedin", href: SITE.social.linkedin },
  { label: "Instagram", icon: "instagram", href: SITE.social.instagram },
  { label: "Pinterest", icon: "pinterest", href: SITE.social.pinterest },
  { label: "YouTube", icon: "youtube", href: SITE.social.youtube },
  { label: "WhatsApp", icon: "whatsapp", href: SITE.whatsapp },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const SUPPORT_LINKS = [
  { label: "Technical Support", href: "/technical-support" },
  { label: "Free Mockup", href: "/free-mockup" },
  ...LEGAL_LINKS.map((l) => ({ label: l.label, href: l.href })),
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-display mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-foreground/70 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="space-y-5">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-foreground/70">
              {SITE.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-9 place-items-center rounded-lg border bg-background text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                >
                  <AppIcon name={s.icon} size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <FooterColumn
            title="Services"
            links={SERVICES.map((s) => ({ label: s.title, href: s.href }))}
          />

          {/* Company */}
          <FooterColumn title="Company" links={COMPANY_LINKS} />

          {/* Support & Legal */}
          <FooterColumn title="Support & Legal" links={SUPPORT_LINKS} />
        </div>

        {/* Contact strip */}
        <div className="mt-12 grid gap-6 rounded-xl border bg-background p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name="phone" size={18} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Call us</p>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="text-sm font-medium hover:text-primary">
                {SITE.phone}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name="mail" size={18} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Email us</p>
              <a href={`mailto:${SITE.email}`} className="text-sm font-medium hover:text-primary">
                {SITE.email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name="pin" size={18} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Visit us</p>
              <p className="text-sm font-medium">{SITE.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name="clock" size={18} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Working hours</p>
              <p className="text-sm font-medium">{SITE.hours}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AppIcon name="shield" size={14} />
            <span className="text-xs">SSL secured · Built by {SITE.name}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Re-export cn so the file stays a single import point if needed elsewhere
export { cn };
