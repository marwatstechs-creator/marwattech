import type { Metadata } from "next";

import { GetStartedFlow } from "@/components/forms/get-started-flow";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Get Started",
    description:
      "Start with a free strategy call. Tell us what you're building — we plan and scope your exact requirements and match you with the right expert within 24 hours.",
    path: "/get-started",
  });
}

type SearchParams = Promise<{ step?: string }>;

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { step } = await searchParams;
  return <GetStartedFlow initialStep={step} />;
}
