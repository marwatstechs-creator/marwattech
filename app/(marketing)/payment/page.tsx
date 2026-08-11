import type { Metadata } from "next";

import { PaymentCheckout } from "@/components/marketing/payment-checkout";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { resolvePaypalConfig } from "@/lib/payments/paypal";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pay Online",
  description:
    "Pay Marwat Tech securely online via PayPal. Cards, PayPal balance, Venmo and Pay Later accepted where available.",
  path: "/payment",
});

type SearchParams = Promise<{
  amount?: string;
  currency?: string;
  item?: string;
  type?: string;
  name?: string;
  email?: string;
}>;

export default async function PaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const cfg = await resolvePaypalConfig();

  const amount = params.amount ? Number(params.amount) : null;
  const type =
    params.type && ["service", "project", "deposit", "custom"].includes(params.type)
      ? params.type
      : undefined;

  return (
    <>
      <PageHero
        badge="Secure checkout"
        title="Pay Online"
        description="Make a secure payment for your project, service or deposit. We use PayPal's advanced checkout — cards, PayPal balance, Venmo and Pay Later are accepted where available."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Pay Online" }]}
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <PaymentCheckout
          configured={cfg.enabled}
          clientId={cfg.clientId}
          env={cfg.env}
          initial={{
            amount: amount && Number.isFinite(amount) && amount > 0 ? amount : null,
            currency: params.currency,
            item: params.item,
            type,
            name: params.name,
            email: params.email,
          }}
        />
      </section>
      <CtaBanner />
    </>
  );
}
