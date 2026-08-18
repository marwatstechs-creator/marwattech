"use client";

import { useMemo, useState } from "react";

import { StudySubjectCard, type StudySubjectCardData } from "@/components/study/subject-card";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { PublicStudyMaterial } from "@/lib/db/content";

const FILE_ICONS: Record<string, string> = {
  pdf: "document",
  doc: "document",
  docx: "document",
  zip: "box",
  pptx: "chart",
  xlsx: "table",
};

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-none whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium capitalize transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function MaterialCardView({ m }: { m: PublicStudyMaterial }) {
  return (
    <Card className="card-3d flex flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <AppIcon name={FILE_ICONS[m.file_type ?? ""] ?? "document"} size={22} />
          </span>
          {m.category && <Badge variant="gold">{m.category}</Badge>}
        </div>
        <h2 className="font-display mt-4 text-lg font-bold leading-snug">{m.title}</h2>
        {m.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{m.description}</p>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border px-2.5 py-0.5 font-medium uppercase">
            {m.file_type?.toUpperCase() ?? "FILE"}
          </span>
          {m.file_size != null && <span>{formatBytes(m.file_size)}</span>}
          <span>· {formatDate(m.created_at)}</span>
        </div>
        <Button asChild className="mt-4 w-full">
          <a href={m.file_url} target="_blank" rel="noreferrer">
            <AppIcon name="download" size={16} />
            Download
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Shared catalog for the study pages: a sticky category-filter + search bar
 * (sticks below the navbar) with client-side filtering of the card grid.
 */
export function StudyCatalog({
  kind,
  subjects = [],
  materials = [],
}: {
  kind: "subjects" | "materials";
  subjects?: StudySubjectCardData[];
  materials?: PublicStudyMaterial[];
}) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const items = kind === "subjects" ? subjects : materials;

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      const c = (it as { category?: string | null }).category;
      if (c) set.add(c);
    }
    return Array.from(set);
  }, [items, kind]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      const c = (it as { category?: string | null }).category;
      if (cat !== "all" && c !== cat) return false;
      if (!needle) return true;
      const title = (it as { name?: string }).name ?? (it as { title?: string }).title ?? "";
      return title.toLowerCase().includes(needle);
    });
  }, [items, cat, q, kind]);

  const emptyTitle =
    kind === "subjects"
      ? "No subjects match your search"
      : "No materials match your search";

  return (
    <>
      {/* Sticky category filter + search */}
      <div className="sticky top-[60px] z-30 -mx-4 mb-8 border-y bg-background/90 px-4 py-3 backdrop-blur-md sm:top-[70px] sm:mx-0 sm:px-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Pill active={cat === "all"} onClick={() => setCat("all")}>
              All
            </Pill>
            {categories.map((c) => (
              <Pill key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </Pill>
            ))}
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative w-full shrink-0 md:w-72"
          >
            <AppIcon
              name="search"
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={kind === "subjects" ? "Search subjects…" : "Search materials…"}
              className="pl-9"
            />
          </form>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/40 p-14 text-center">
          <AppIcon name="search" size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{emptyTitle} — try another keyword or category.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) =>
            kind === "subjects" ? (
              <StudySubjectCard key={it.id} subject={it as StudySubjectCardData} />
            ) : (
              <MaterialCardView key={it.id} m={it as PublicStudyMaterial} />
            )
          )}
        </div>
      )}
    </>
  );
}
