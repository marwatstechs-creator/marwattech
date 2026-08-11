"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { BlogCardV2, type BlogPostCard } from "@/components/marketing/blog-card-v2";
import { BlogCover } from "@/components/marketing/blog-cover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate, readingTime } from "@/lib/utils";

/* ── Stats (EDIT THESE with your real company numbers) ───────────────── */
const STATS = [
  { value: 150, suffix: "+", label: "Projects delivered" },
  { value: 80, suffix: "+", label: "Happy clients" },
  { value: 5, suffix: "+", label: "Years of experience" },
  { value: 24, suffix: "/7", label: "Dedicated support" },
];

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <p
      ref={ref}
      className="font-display text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-none tracking-[-0.02em] tabular-nums text-primary"
    >
      {display}
      {suffix}
    </p>
  );
}

function CategoryPill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-none rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

const reveal = (delay: number) => ({
  initial: { y: "115%", opacity: 0 },
  whileInView: { y: "0%", opacity: 1 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay },
});

export function BlogPageClient({
  posts,
  categories,
  activeCategory,
  q,
  page,
  totalPages,
}: {
  posts: BlogPostCard[];
  categories: { name: string; slug: string }[];
  activeCategory?: string;
  q?: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q ?? "");

  // Hero aside shows the most recent article; the grid starts after it.
  const heroPost = posts[0];
  const gridPosts = posts.slice(1);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (activeCategory) p.set("category", activeCategory);
    router.push(`/blog${p.toString() ? `?${p.toString()}` : ""}`);
  };

  const query = new URLSearchParams();
  if (activeCategory) query.set("category", activeCategory);
  if (q) query.set("q", q);
  const loadMoreHref = `/blog?page=${page + 1}${query.toString() ? `&${query.toString()}` : ""}`;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="w-full pb-10 pt-16 sm:pt-20 lg:pb-14 lg:pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-foreground/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                The Marwat Tech Blog
              </motion.p>

              <h1 className="font-display text-[clamp(2.125rem,6vw,4.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">
                <span className="block overflow-hidden pb-[0.18em]">
                  <motion.span className="block" {...reveal(0.05)}>
                    The Reading Room.
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-[0.18em]">
                  <motion.span className="block" {...reveal(0.15)}>
                    Built by Experts For{" "}
                    <span className="text-primary">Growth.</span>
                  </motion.span>
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-5 max-w-[46ch] text-base text-muted-foreground sm:text-lg"
              >
                Practical advice on web development, SEO, ecommerce and AI —
                from the people who build it every day.
              </motion.p>
            </div>

            {heroPost && (
              <motion.aside
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="min-w-0"
              >
                <Link
                  aria-label={`Read the latest article: ${heroPost.title}`}
                  href={`/blog/${heroPost.slug}`}
                  className="group flex gap-4 rounded-3xl border bg-card p-4 transition-colors duration-300 hover:bg-accent-hover sm:gap-5 sm:p-5"
                >
                  <BlogCover
                    src={heroPost.cover_image}
                    alt={heroPost.title}
                    className="min-h-[130px] w-[38%] flex-none self-stretch rounded-2xl"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-0.5">
                    <p className="flex items-baseline justify-between gap-3 text-[11px] font-medium text-muted-foreground">
                      <span className="truncate">
                        {heroPost.profiles?.full_name ?? "Marwat Tech"} •{" "}
                        {formatDate(heroPost.published_at)}
                      </span>
                      <span className="flex-none">
                        {heroPost.reading_time ??
                          readingTime(heroPost.content ?? "")}{" "}
                        min
                      </span>
                    </p>
                    <h2 className="line-clamp-3 text-[17px] font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
                      {heroPost.title}
                    </h2>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                      <span className="truncate rounded-full border px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {heroPost.blog_categories?.name ?? "Insights"}
                      </span>
                      <span
                        aria-hidden
                        className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.aside>
            )}
          </div>
        </div>
      </section>

      {/* ── Category rail + search ───────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="toolbar"
            aria-label="Filter articles by category"
            className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-card p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <CategoryPill href="/blog" active={!activeCategory}>
              All
            </CategoryPill>
            {categories.map((c) => (
              <CategoryPill
                key={c.slug}
                href={`/blog?category=${c.slug}`}
                active={activeCategory === c.slug}
              >
                {c.name}
              </CategoryPill>
            ))}
          </div>
          <form onSubmit={submitSearch} className="relative w-full sm:w-56" role="search">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              aria-label="Search articles"
              className="h-10 rounded-full pl-9"
            />
          </form>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border bg-card p-5 sm:rounded-[36px] sm:p-8 lg:p-10">
          {gridPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center text-muted-foreground">
              No articles found{q ? ` for “${q}”` : ""}. Try a different search
              or category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((p, i) => (
                <motion.div
                  key={p.id}
                  className={cn(i === 0 && "sm:col-span-2")}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: "easeOut" }}
                >
                  <BlogCardV2 post={p} featured={i === 0} />
                </motion.div>
              ))}
            </div>
          )}

          {page < totalPages && (
            <div className="flex justify-center pt-12">
              <Link
                href={loadMoreHref}
                className="rounded-full border border-primary px-7 py-2.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Load more
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── In numbers ───────────────────────────────────────────── */}
      <section aria-label="Why trust what we write" className="pb-20 lg:pb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center justify-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
              <span aria-hidden className="h-1.5 w-1.5 flex-none rounded-full bg-primary" />
              Why trust what we write
            </p>
            <h2 className="mx-auto mb-12 max-w-[24ch] font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold tracking-[-0.02em] text-foreground">
              Marwat Tech, In Numbers.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                className="rounded-3xl border bg-card px-6 py-9 text-center sm:px-8"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
              >
                <CountUp value={s.value} suffix={s.suffix} />
                <p className="mt-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
