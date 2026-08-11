import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/app-icon";
import { unsubscribeByToken } from "@/lib/actions/marketing";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Unsubscribe",
  description: "Unsubscribe from Marwat Tech marketing emails.",
  path: "/unsubscribe",
});

type SearchParams = Promise<{ token?: string }>;

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  const done = token ? (await unsubscribeByToken(token)).ok : false;

  return (
    <>
      <PageHero
        badge="Newsletter"
        title={done ? "You're unsubscribed" : "Unsubscribe"}
        description={
          done
            ? "You've been removed from our marketing list. You can always re-subscribe anytime."
            : "Use the unsubscribe link from any marketing email to stop receiving updates."
        }
      />
      <section className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <AppIcon name={done ? "check" : "mail"} size={28} />
            </span>
            <p className="text-sm text-muted-foreground">
              {done
                ? "No more marketing emails. Transactional emails (invoices, receipts) will continue."
                : "Need to leave? Find the 'Unsubscribe' link at the bottom of any marketing email from us."}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="gold">
                <Link href="/">Back to home</Link>
              </Button>
              {!done && (
                <Button asChild variant="outline">
                  <Link href="/contact">Contact us</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
      <CtaBanner />
    </>
  );
}
