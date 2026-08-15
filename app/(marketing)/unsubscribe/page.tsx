import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/app-icon";
import { unsubscribeByToken } from "@/lib/actions/marketing";
import { unsubscribeCourseByToken } from "@/lib/actions/course-notifications";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
  title: "Unsubscribe",
  description: "Unsubscribe from Marwat Tech email updates.",
  path: "/unsubscribe",
  });
}

type SearchParams = Promise<{ token?: string }>;

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  const [newsletter, course] = token
    ? await Promise.all([unsubscribeByToken(token), unsubscribeCourseByToken(token)])
    : [{ ok: false }, { ok: false }];
  const done = Boolean(token) && newsletter.ok && course.ok;

  return (
    <>
      <PageHero
        badge="Email Preferences"
        title={done ? "You're unsubscribed" : "Unsubscribe"}
        description={
          done
            ? "You've been unsubscribed from course updates and marketing emails. You can re-subscribe anytime."
            : "Use the unsubscribe link from any course-update or marketing email to stop receiving updates."
        }
      />
      <section className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="icon-3d-tile grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <AppIcon name={done ? "check" : "mail"} size={28} />
            </span>
            <p className="text-sm text-muted-foreground">
              {done
                ? "No more course-update or marketing emails. Transactional emails (invoices, receipts) will continue."
                : "Need to leave? Find the 'Unsubscribe' link at the bottom of any course-update or marketing email from us."}
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
