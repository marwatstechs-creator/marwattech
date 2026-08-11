import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogCover } from "@/components/marketing/blog-cover";
import { cn } from "@/lib/utils";
import { formatDate, readingTime } from "@/lib/utils";

export type BlogPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  published_at: string | null;
  reading_time: number | null;
  blog_categories?: { name: string; slug: string } | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

/**
 * RocketDevs-style blog card — meta row, title, category chip + arrow,
 * cover image at the bottom, subtle lift + image zoom on hover.
 */
export function BlogCardV2({
  post,
  featured = false,
}: {
  post: BlogPostCard;
  featured?: boolean;
}) {
  const href = `/blog/${post.slug}`;
  const category = post.blog_categories?.name ?? "Insights";
  const author = post.profiles?.full_name ?? "Marwat Tech";
  const minutes = post.reading_time ?? readingTime(post.content ?? "");

  return (
    <Link href={href} className="group block h-full no-underline">
      <article className="flex h-full flex-col gap-3.5 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        <p className="flex items-baseline justify-between gap-3 text-[11px] font-medium text-muted-foreground">
          <span className="truncate">
            {author} •{" "}
            <time dateTime={post.published_at ?? undefined}>
              {formatDate(post.published_at)}
            </time>
          </span>
          <span className="flex-none">{minutes} min</span>
        </p>

        <h2
          className={cn(
            "line-clamp-2 font-display font-bold leading-snug text-foreground transition-colors group-hover:text-primary",
            featured ? "text-xl sm:text-2xl" : "text-lg"
          )}
        >
          {post.title}
        </h2>

        {post.excerpt && !featured && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="truncate rounded-full border px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {category}
          </span>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <BlogCover
          src={post.cover_image}
          alt={post.title}
          featured={featured}
          className={cn(
            "mt-auto rounded-[18px]",
            featured ? "aspect-[16/9] sm:aspect-[21/10]" : "aspect-[16/10]"
          )}
        />
      </article>
    </Link>
  );
}
