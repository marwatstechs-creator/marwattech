import Link from "next/link";
import Image from "next/image";
import { AppIcon } from "@/components/app-icon";
import { formatDate, readingTime } from "@/lib/utils";

type Post = {
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  content?: string;
  blog_categories?: { name: string; slug: string } | null;
  profiles?: { full_name: string | null } | null;
};

export function BlogCard({ post }: { post: Post }) {
  const href = `/blog/${post.slug}`;

  return (
    <Link href={href} className="group block h-full">
      <article className="card-3d flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted/40">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              width={640}
              height={360}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/15 via-gold/10 to-azure/15">
              <AppIcon name="sparkles" size={32} className="text-primary/50" />
            </div>
          )}
          {post.blog_categories && (
            <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              {post.blog_categories.name}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <time dateTime={post.published_at ?? undefined}>
              {formatDate(post.published_at)}
            </time>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <AppIcon name="clock" size={12} />
              {readingTime(post.content ?? "")} min read
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}
          {post.profiles?.full_name && (
            <p className="text-xs font-medium text-muted-foreground">
              By {post.profiles.full_name}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
