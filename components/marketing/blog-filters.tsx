"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BLOG_CATEGORIES } from "@/lib/constants";
import { AppIcon } from "@/components/app-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BlogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const activeCategory = searchParams.get("category");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set("q", q.trim());
      params.delete("page");
    } else {
      params.delete("q");
    }
    router.push(`/blog?${params.toString()}`);
  };

  return (
    <div className="mb-10 space-y-5">
      <form
        onSubmit={submitSearch}
        className="mx-auto flex max-w-md gap-2"
        role="search"
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles…"
          aria-label="Search articles"
          className="h-10"
        />
        <Button type="submit" className="h-10 shrink-0">
          <AppIcon name="search" size={16} />
          Search
        </Button>
      </form>

      <nav
        aria-label="Blog categories"
        className="flex flex-wrap justify-center gap-2"
      >
        <Link
          href="/blog"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            !activeCategory
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-foreground/80 hover:border-primary/50 hover:text-primary"
          )}
        >
          All
        </Link>
        {BLOG_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/blog?category=${c.slug}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeCategory === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-foreground/80 hover:border-primary/50 hover:text-primary"
            )}
          >
            {c.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
