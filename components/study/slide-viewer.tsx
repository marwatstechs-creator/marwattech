"use client";

import * as React from "react";
import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { MarkdownLite } from "@/components/markdown-lite";
import { cn } from "@/lib/utils";

export type SlideData = {
  id: string;
  slide_number: number;
  title: string;
  content: string;
};

/**
 * University-style slide viewer: previous/next, slide number + total,
 * progress bar, fullscreen, download PDF (week pdf_url or print), and
 * keyboard navigation (← → Home End F Esc).
 */
export function SlideViewer({
  slides,
  subjectName,
  subjectSlug,
  weekTitle,
  weekNumber,
  pdfUrl,
}: {
  slides: SlideData[];
  subjectName: string;
  subjectSlug: string;
  weekTitle: string;
  weekNumber: number;
  pdfUrl: string | null;
}) {
  const [index, setIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const total = slides.length;
  const current = slides[index];

  const go = React.useCallback(
    (n: number) => {
      setIndex(Math.max(0, Math.min(total - 1, n)));
    },
    [total]
  );

  // Keyboard navigation.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(total - 1);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, go]);

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await el.requestFullscreen().catch(() => {});
    }
  }

  function downloadPdf() {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener");
      return;
    }
    window.print();
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        No slides published for this week yet.
      </div>
    );
  }

  const progress = total > 1 ? (index / (total - 1)) * 100 : 100;

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/study" className="hover:text-foreground">
          Study
        </Link>
        <span>/</span>
        <Link href={`/study/${subjectSlug}`} className="hover:text-foreground">
          {subjectName}
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {weekTitle} (Week {weekNumber})
        </span>
      </nav>

      {/* Slide canvas (16:9) */}
      <div className="aspect-video w-full overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted shadow-lg">
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {subjectName} · Week {weekNumber}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {current.slide_number} / {total}
            </span>
          </header>
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-8 py-6 sm:px-12">
            <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">{current.title}</h2>
            <div className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              <MarkdownLite text={current.content} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border bg-card p-3">
        {/* Progress bar */}
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => go(0)} disabled={index === 0}>
              <AppIcon name="chevronLeft" size={16} className="mr-1" /> First
            </Button>
            <Button variant="outline" size="sm" onClick={() => go(index - 1)} disabled={index === 0}>
              <AppIcon name="chevronLeft" size={16} /> Prev
            </Button>
          </div>

          <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
            <span className="text-foreground">{current.slide_number}</span> / {total}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => go(index + 1)} disabled={index === total - 1}>
              Next <AppIcon name="chevronRight" size={16} className="ml-1" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => go(total - 1)} disabled={index === total - 1}>
              Last <AppIcon name="chevronRight" size={16} className="ml-1" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Keyboard: <kbd className="rounded border bg-muted px-1">←</kbd>{" "}
            <kbd className="rounded border bg-muted px-1">→</kbd> navigate ·{" "}
            <kbd className="rounded border bg-muted px-1">F</kbd> fullscreen
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <AppIcon name="maximize" size={15} className="mr-2" />
              Fullscreen
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <AppIcon name="download" size={15} className="mr-2" />
              {pdfUrl ? "Download PDF" : "Print / PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-2.5 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            )}
          />
        ))}
      </div>

      {/* Print styles: all slides when printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .slide-print { display: block !important; break-after: page; }
        }
      `}</style>
      <div className="slide-print hidden">
        {slides.map((s) => (
          <div key={s.id} className="mb-8 border-b pb-6">
            <h2 className="mb-2 text-xl font-bold">{s.slide_number}. {s.title}</h2>
            <MarkdownLite text={s.content} />
          </div>
        ))}
      </div>
    </div>
  );
}
