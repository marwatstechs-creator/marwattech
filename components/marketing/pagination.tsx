import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.category) params.set("category", searchParams.category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="grid size-9 place-items-center rounded-md border bg-card transition-colors hover:border-primary hover:text-primary"
          aria-label="Previous page"
        >
          <AppIcon name="arrowLeft" size={16} />
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={cn(
            "grid size-9 place-items-center rounded-md border text-sm font-medium transition-colors",
            p === currentPage
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card hover:border-primary hover:text-primary"
          )}
        >
          {p}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="grid size-9 place-items-center rounded-md border bg-card transition-colors hover:border-primary hover:text-primary"
          aria-label="Next page"
        >
          <AppIcon name="arrowRight" size={16} />
        </Link>
      )}
    </nav>
  );
}
