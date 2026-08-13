import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type FaqItem = { question: string; answer: string };

/** FAQ accordion + FAQPage structured data (rich results on Google). */
export function Faq({
  items,
  title = "Frequently asked questions",
  description,
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-center text-2xl font-bold sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          {description}
        </p>
      )}

      <div className="card-3d mt-8 rounded-2xl border bg-card p-2">
        <Accordion type="single" collapsible className="w-full">
          {items.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b last:border-0"
            >
              <AccordionTrigger className="px-4 text-left text-sm font-semibold">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
