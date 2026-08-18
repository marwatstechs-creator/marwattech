import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { JobApplyButton } from "@/components/marketing/job-apply";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getOpenCareers } from "@/lib/db/content";
import { EditorContent } from "@/components/editor/EditorContent";
import { DEMO_CAREERS } from "@/lib/demo";
import { buildMetadata } from "@/lib/seo";
import { jobPostingJsonLd } from "@/lib/seo-jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
  title: "Careers",
  description:
    "Join the Marwat Tech team — we’re hiring developers, designers and marketers. See open positions and apply today.",
  path: "/careers",
  });
}

const PERKS = [
  { icon: "wallet" as const, title: "Competitive pay", text: "Fair, market-aligned salaries reviewed regularly." },
  { icon: "clock" as const, title: "Flexible hours", text: "Work when you’re most productive." },
  { icon: "globe" as const, title: "Remote-friendly", text: "Work from anywhere in the world." },
  { icon: "rocket" as const, title: "Grow with us", text: "Real projects, real impact, rapid learning." },
];

export default async function CareersPage() {
  let careers = DEMO_CAREERS;
  try {
    const db = await createClient();
    const data = await getOpenCareers(db);
    careers = data.length ? data : DEMO_CAREERS;
  } catch {
    // fallback
  }

  return (
    <>
      <JsonLd
        data={careers.map((job) =>
          jobPostingJsonLd({
            title: job.title,
            slug: job.slug,
            department: job.department,
            location: job.location,
            job_type: job.job_type,
            description: job.description,
            datePosted: job.created_at,
          })
        )}
      />
      <PageHero
        badge="Careers"
        title="Build your career with Marwat Tech"
        description="We’re a growing, remote-friendly team of developers, designers and marketers who care about craft and clients."
        breadcrumbs={[{ label: "Careers" }]}
      />

      {/* Perks */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-xl border bg-card p-6">
              <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <AppIcon name={p.icon} size={22} />
              </span>
              <h3 className="font-display mb-1 font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open roles */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display mb-8 text-3xl font-bold">
            Open positions
          </h2>

          {careers.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-16 text-center">
              <p className="text-muted-foreground">
                No open positions right now — but we’re always interested in
                great people. Email{" "}
                <a href={`mailto:${SITE.email}`} className="font-medium text-primary underline">
                  {SITE.email}
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {careers.map((job) => {
                const jobAny = job as unknown as {
                  description_json?: unknown;
                  requirements_json?: unknown;
                };
                return (
                  <Card key={job.id}>
                    <CardContent className="p-6 sm:p-8">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-3">
                          <h3 className="font-display text-xl font-bold">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {job.department && (
                              <Badge variant="default">{job.department}</Badge>
                            )}
                            {job.location && (
                              <Badge variant="secondary">
                                <AppIcon name="pin" size={12} />
                                {job.location}
                              </Badge>
                            )}
                            {job.job_type && (
                              <Badge variant="outline">{job.job_type}</Badge>
                            )}
                            {job.salary_range && (
                              <Badge variant="gold">{job.salary_range}</Badge>
                            )}
                          </div>
                        </div>
                        <JobApplyButton careerId={job.id} position={job.title} />
                      </div>

                      {job.description && (
                        <div className="mt-6 border-t pt-6">
                          <EditorContent
                            content={job.description}
                            contentJson={jobAny.description_json}
                            className="text-sm"
                          />
                        </div>
                      )}
                      {job.requirements && (
                        <div className="mt-6">
                          <h4 className="font-display mb-2 font-semibold">
                            Requirements
                          </h4>
                          <EditorContent
                            content={job.requirements}
                            contentJson={jobAny.requirements_json}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
