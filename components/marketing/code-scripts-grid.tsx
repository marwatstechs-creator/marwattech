"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { codeScriptUrl, buildExcerpt, codeScriptCategoryLabel, CODE_SCRIPTS_PAGE_SIZE } from "@/lib/code-scripts";
import { getMoreCodeScripts, type CodeScriptCard } from "@/lib/actions/public/code-scripts";

function Card({ s }: { s: CodeScriptCard }) {
  return (
    <Link
      href={codeScriptUrl(s.slug)}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {s.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.cover_image}
            alt={s.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center"
            style={{ background: "linear-gradient(135deg,#7464c6 0%,#4b3ea1 100%)" }}
          >
            <AppIcon name="code" size={40} className="text-white/40" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {s.category && (
            <Badge variant="gold" className="text-[11px]">
              {codeScriptCategoryLabel(s.category)}
            </Badge>
          )}
        </div>
        {s.version && (
          <div className="absolute right-3 top-3">
            <Badge className="bg-background/80 text-[11px] backdrop-blur">v{s.version}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary">
          {s.title}
        </h3>
        {s.content && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{buildExcerpt(s.content, 120)}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-muted-foreground">
            {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            View <AppIcon name="arrowRight" size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Infinite-scroll grid: loads the next page automatically when the sentinel
 * scrolls into view, until every card is shown.
 */
export function CodeScriptsGrid({
  initial,
  category,
}: {
  initial: CodeScriptCard[];
  category?: string;
}) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initial.length >= CODE_SCRIPTS_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    try {
      const more = await getMoreCodeScripts({
        category,
        offset: items.length,
        limit: CODE_SCRIPTS_PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...more]);
      setHasMore(more.length >= CODE_SCRIPTS_PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [category, hasMore, items.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Card key={s.id} s={s} />
        ))}
      </div>
      <div
        ref={sentinelRef}
        className="flex min-h-[72px] items-center justify-center pt-6 text-sm text-muted-foreground"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading more…
          </span>
        ) : hasMore ? (
          "Scroll to load more"
        ) : (
          <span className="inline-flex items-center gap-2">
            <AppIcon name="check" size={15} /> All {items.length} scripts loaded
          </span>
        )}
      </div>
    </>
  );
}
