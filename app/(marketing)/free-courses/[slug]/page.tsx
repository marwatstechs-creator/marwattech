import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppIcon } from "@/components/app-icon";
import { PromoCodeCard, type PromoCodeCardData } from "@/components/marketing/promo-code-card";
import { createClient } from "@/lib/supabase/server";
import { getEnabledPromoCodes, type PromoCode } from "@/lib/db/content";
import { promoCodeSlug } from "@/lib/promo/slug";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

function toCard(c: PromoCode): PromoCodeCardData {
  return {
    id: c.id,
    title: c.title,
    store: c.store,
    code: c.code,
    discount_label: c.discount_label,
    url: c.url,
    image_url: c.image_url,
    category: c.category,
    expiry: c.expires_at ? c.expires_at.slice(0, 10) : null,
  };
}

async function findCode(slug: string): Promise<PromoCode | null> {
  try {
    const db = await createClient();
    const codes = await getEnabledPromoCodes(db);
    return codes.find((c) => promoCodeSlug(c.title, c.id) === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const code = await findCode(slug);
  if (!code) return {};
  return buildMetadata({
    title: `${code.title} — Free ${code.store} Coupon Code`,
    description: `Get ${code.title} for free with coupon code ${code.code}. ${code.discount_label ?? "100% off"}${code.expires_at ? ` — expires ${code.expires_at.slice(0, 10)}.` : ""}`,
    path: `/free-courses/${slug}`,
  });
}

export default async function PromoCodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const code = await findCode(slug);
  if (!code) notFound();

  return (
    <div className="container py-10 sm:py-14">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/free-courses" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
          <AppIcon name="arrowLeft" size={15} /> Free Courses
        </Link>
      </nav>

      <div className="mx-auto max-w-md">
        <PromoCodeCard code={toCard(code)} />
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
        Not what you need, or expired?{" "}
        <Link href="/free-courses" className="font-medium text-primary underline">
          Browse all free courses
        </Link>
        .
      </p>
    </div>
  );
}
