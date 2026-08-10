import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  badge?: string;
  align?: "center" | "left";
};

export function PageHero({
  title,
  description,
  breadcrumbs,
  badge,
  align = "center",
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b bg-muted/40">
      {/* Decorative gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--brand)/0.08),transparent)]"
      />
      <div
        className={cn(
          "relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8",
          align === "center" ? "text-center" : "text-left"
        )}
      >
        {breadcrumbs && (
          <div className={cn(align === "center" && "flex justify-center")}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        {badge && (
          <Badge variant="gold" className="mb-4 uppercase tracking-wide">
            {badge}
          </Badge>
        )}
        <h1 className="font-display max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
