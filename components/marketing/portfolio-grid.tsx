import { PortfolioCard } from "@/components/marketing/portfolio-card";
import type { Database } from "@/types/database";

type Project = Database["public"]["Tables"]["portfolio_items"]["Row"] & {
  portfolio_categories?: { name: string; slug: string } | null;
};

export function PortfolioGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
        <p className="text-muted-foreground">
          No projects in this category yet — check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <PortfolioCard key={p.id} project={p} />
      ))}
    </div>
  );
}
