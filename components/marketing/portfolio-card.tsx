import Link from "next/link";
import Image from "next/image";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Project = {
  title: string;
  slug: string;
  cover_image: string | null;
  industry: string | null;
  portfolio_categories?: { name: string; slug: string } | null;
};

export function PortfolioCard({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const category = project.portfolio_categories?.name ?? "Web Project";
  const href = `/portfolio/${project.slug}`;

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="card-3d relative overflow-hidden rounded-xl border bg-muted/40">
        {project.cover_image ? (
          <Image
            src={project.cover_image}
            alt={project.title}
            width={800}
            height={600}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid aspect-[4/3] w-full place-items-center bg-gradient-to-br from-primary/15 via-gold/10 to-azure/15">
            <AppIcon name="layers" size={40} className="text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-between p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-sm font-medium text-white">View case study</span>
          <AppIcon name="arrowUpRight" size={18} className="text-white" />
        </div>
        <Badge variant="gold" className="absolute left-3 top-3">
          {category}
        </Badge>
      </div>
      <div className="mt-3 space-y-1 px-1">
        <h3 className="font-display font-semibold text-foreground group-hover:text-primary">
          {project.title}
        </h3>
        {project.industry && (
          <p className="text-sm text-muted-foreground">{project.industry}</p>
        )}
      </div>
    </Link>
  );
}
