"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AsyncSwitch } from "@/components/admin/async-switch";
import { cn } from "@/lib/utils";
import {
  createStudySubject,
  updateStudySubject,
  deleteStudySubject,
  toggleStudySubject,
  createStudyWeek,
  deleteStudyWeek,
  toggleStudyWeek,
  createStudySlide,
  updateStudySlide,
  deleteStudySlide,
  toggleStudySlide,
  generateWeekSlides,
  type StudySubjectInput,
  type StudySlideInput,
} from "@/lib/actions/admin/study-platform";

export type StudySubjectRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructor: string | null;
  category: string | null;
  color: string | null;
  published: boolean;
  sort_order: number;
  week_count: number;
  slide_count: number;
};

export type StudyWeekRow = {
  id: string;
  subject_id: string;
  week_number: number;
  title: string;
  description: string | null;
  pdf_url: string | null;
  published: boolean;
  study_slides: {
    id: string;
    slide_number: number;
    title: string;
    content: string;
    published: boolean;
  }[];
};

export type StudySubjectDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructor: string | null;
  category: string | null;
  color: string | null;
  published: boolean;
  sort_order: number;
};

/* ── Subjects list ────────────────────────────────────────────── */

export function StudyPlatformAdmin({ subjects }: { subjects: StudySubjectRow[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          University-style platform — each subject holds weeks, and each week holds slides.
        </p>
        <Button asChild>
          <Link href="/admin/study-platform/new">
            <AppIcon name="plus" size={16} className="mr-2" />
            New subject
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjects.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No subjects yet — create your first one to get started.
            </CardContent>
          </Card>
        )}
        {subjects.map((s) => (
          <Card key={s.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: s.color || "#7464c6" }}
                  >
                    {s.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    {s.instructor && (
                      <p className="text-xs text-muted-foreground">Instructor: {s.instructor}</p>
                    )}
                  </div>
                </div>
                <Badge variant={s.published ? "default" : "outline"}>
                  {s.published ? "Published" : "Draft"}
                </Badge>
              </div>
              {s.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{s.week_count} weeks</Badge>
                <Badge variant="gold">{s.slide_count} slides</Badge>
                {s.category && <Badge variant="outline">{s.category}</Badge>}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AsyncSwitch itemId={s.id} checked={s.published} action={toggleStudySubject} label="Subject" />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/study-platform/${s.id}`}>Edit</Link>
                  </Button>
                </div>
                <DeleteButton
                  label="Subject"
                  onConfirm={async () => {
                    const res = await deleteStudySubject(s.id);
                    if ("error" in res && res.error) return toast.error(res.error);
                    toast.success("Subject deleted");
                    window.location.reload();
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Subject create/edit ──────────────────────────────────────── */

export function StudySubjectForm({ subject }: { subject?: StudySubjectDetail | null }) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: subject?.name ?? "",
    slug: subject?.slug ?? "",
    description: subject?.description ?? "",
    instructor: subject?.instructor ?? "",
    category: subject?.category ?? "",
    color: subject?.color ?? "#7464c6",
    published: subject?.published ?? false,
    sort_order: subject?.sort_order ?? 0,
  });
  const [saving, setSaving] = React.useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = k === "published" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  async function save() {
    setSaving(true);
    const input: StudySubjectInput = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      description: form.description,
      instructor: form.instructor,
      category: form.category,
      color: form.color,
      published: form.published,
      sort_order: Number(form.sort_order) || 0,
    };
    if (subject) {
      const res = await updateStudySubject(subject.id, input);
      setSaving(false);
      if ("error" in res && res.error) return toast.error(res.error);
      toast.success("Subject updated");
      router.refresh();
    } else {
      const res = await createStudySubject(input);
      setSaving(false);
      if ("error" in res && res.error) return toast.error(res.error);
      toast.success("Subject created");
      router.push(`/admin/study-platform/${res.id}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{subject ? "Edit subject" : "New subject"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={set("name")} placeholder="e.g. Web Development Fundamentals" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={form.slug} onChange={set("slug")} placeholder="web-development-fundamentals" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} value={form.description} onChange={set("description")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instructor">Instructor</Label>
          <Input id="instructor" value={form.instructor} onChange={set("instructor")} placeholder="e.g. Engr. Marwat" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Input id="category" value={form.category} onChange={set("category")} placeholder="e.g. Web Development" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">Accent color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-9 w-12 cursor-pointer rounded-md border bg-transparent"
            />
            <Input value={form.color} onChange={set("color")} className="font-mono text-xs" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sort_order">Sort order</Label>
          <Input id="sort_order" type="number" min={0} value={form.sort_order} onChange={set("sort_order")} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
          />
          Published (visible on /study)
        </label>
        <div className="flex items-end justify-end">
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : subject ? "Save changes" : "Create subject"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Subject detail: weeks + slides ───────────────────────────── */

export function StudySubjectDetailAdmin({
  subject,
  weeks,
}: {
  subject: StudySubjectDetail;
  weeks: StudyWeekRow[];
}) {
  const router = useRouter();
  const [weekForm, setWeekForm] = React.useState({ week_number: 0, title: "", description: "", pdf_url: "" });
  const [savingWeek, setSavingWeek] = React.useState(false);

  async function addWeek() {
    if (!weekForm.title.trim()) return toast.error("Week title is required");
    setSavingWeek(true);
    const res = await createStudyWeek({
      subject_id: subject.id,
      week_number: Number(weekForm.week_number) || 0,
      title: weekForm.title.trim(),
      description: weekForm.description,
      pdf_url: weekForm.pdf_url,
      published: false,
    });
    setSavingWeek(false);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Week added");
    setWeekForm({ week_number: 0, title: "", description: "", pdf_url: "" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <StudySubjectForm subject={subject} />

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Weeks</h2>
      </div>

      {/* Add week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add week</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Week number (0 = auto)</Label>
            <Input type="number" min={0} value={weekForm.week_number} onChange={(e) => setWeekForm((f) => ({ ...f, week_number: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={weekForm.title} onChange={(e) => setWeekForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 1 — HTML Basics" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Input value={weekForm.description} onChange={(e) => setWeekForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>PDF download URL (optional)</Label>
            <Input value={weekForm.pdf_url} onChange={(e) => setWeekForm((f) => ({ ...f, pdf_url: e.target.value }))} placeholder="https://…/week1.pdf" />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button onClick={addWeek} disabled={savingWeek}>
              {savingWeek ? "Adding…" : "Add week"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {weeks.length === 0 && (
        <p className="text-sm text-muted-foreground">No weeks yet — add one above.</p>
      )}
      {weeks.map((w) => (
        <WeekCard key={w.id} week={w} />
      ))}
    </div>
  );
}

function WeekCard({ week }: { week: StudyWeekRow }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [slideForm, setSlideForm] = React.useState({ slide_number: 0, title: "", content: "" });
  const [aiTopic, setAiTopic] = React.useState("");
  const [aiCount, setAiCount] = React.useState(8);
  const [busy, setBusy] = React.useState<"" | "save" | "ai">("");

  async function addSlide() {
    if (!slideForm.title.trim() || !slideForm.content.trim()) return toast.error("Title and content are required");
    setBusy("save");
    const res = await createStudySlide({
      week_id: week.id,
      slide_number: Number(slideForm.slide_number) || 0,
      title: slideForm.title.trim(),
      content: slideForm.content,
      published: false,
    });
    setBusy("");
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Slide added");
    setSlideForm({ slide_number: 0, title: "", content: "" });
    router.refresh();
  }

  async function generateSlides() {
    if (!aiTopic.trim()) return toast.error("Enter a topic for the slides");
    setBusy("ai");
    const res = await generateWeekSlides({ week_id: week.id, topic: aiTopic.trim(), count: aiCount });
    setBusy("");
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success(`Generated ${res.count} draft slides`);
    setAiTopic("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="gold">Week {week.week_number}</Badge>
            <CardTitle className="text-base">{week.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <AsyncSwitch itemId={week.id} checked={week.published} action={toggleStudyWeek} label="Week" />
            <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Hide slides" : `${week.study_slides.length} slides`}
            </Button>
            <DeleteButton
              label="Week"
              onConfirm={async () => {
                const res = await deleteStudyWeek(week.id);
                if ("error" in res && res.error) return toast.error(res.error);
                toast.success("Week deleted");
                router.refresh();
              }}
            />
          </div>
        </div>
        {week.description && <p className="text-sm text-muted-foreground">{week.description}</p>}
        {week.pdf_url && (
          <p className="text-xs text-muted-foreground">
            PDF: <span className="font-mono">{week.pdf_url}</span>
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* AI generation */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <AppIcon name="ai" size={16} className="text-primary" />
              Generate slides with AI
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. HTML forms, CSS flexbox, PHP loops…"
                className="flex-1 min-w-[200px]"
              />
              <Input
                type="number"
                min={4}
                max={20}
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-24"
                title="Number of slides"
              />
              <Button variant="secondary" onClick={generateSlides} disabled={busy === "ai"}>
                <AppIcon name="sparkles" size={16} className="mr-2" />
                {busy === "ai" ? "Generating…" : "Generate"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Creates draft slides (hidden) via DeepSeek — review and publish each one.
            </p>
          </div>

          {/* Slides list */}
          {week.study_slides.length === 0 && (
            <p className="text-sm text-muted-foreground">No slides yet.</p>
          )}
          <div className="space-y-2">
            {week.study_slides.map((s) => (
              <SlideRow key={s.id} slide={s} weekId={week.id} />
            ))}
          </div>

          {/* Add slide */}
          <div className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-semibold">Add a slide manually</p>
            <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
              <Input
                type="number"
                min={0}
                value={slideForm.slide_number}
                onChange={(e) => setSlideForm((f) => ({ ...f, slide_number: Number(e.target.value) }))}
                placeholder="Number (0=auto)"
              />
              <Input
                value={slideForm.title}
                onChange={(e) => setSlideForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Slide title"
              />
            </div>
            <Textarea
              rows={3}
              className="mt-2"
              value={slideForm.content}
              onChange={(e) => setSlideForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Slide content (markdown: bullets, code…)"
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={addSlide} disabled={busy === "save"}>
                {busy === "save" ? "Adding…" : "Add slide"}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function SlideRow({
  slide,
  weekId,
}: {
  slide: { id: string; slide_number: number; title: string; content: string; published: boolean };
  weekId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    slide_number: slide.slide_number,
    title: slide.title,
    content: slide.content,
  });
  const [busy, setBusy] = React.useState(false);

  async function saveSlide() {
    setBusy(true);
    const input: StudySlideInput = {
      week_id: weekId,
      slide_number: Number(form.slide_number) || slide.slide_number,
      title: form.title || slide.title,
      content: form.content || slide.content || " ",
      published: slide.published,
    };
    const res = await updateStudySlide(slide.id, input);
    setBusy(false);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Slide saved");
    router.refresh();
  }

  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <button className="flex items-center gap-2 text-left" onClick={() => setOpen((v) => !v)}>
          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-semibold">
            {slide.slide_number}
          </span>
          <span className={cn("text-sm", !slide.published && "text-muted-foreground")}>{slide.title}</span>
          {!slide.published && <Badge variant="outline">draft</Badge>}
        </button>
        <div className="flex items-center gap-2">
          <AsyncSwitch itemId={slide.id} checked={slide.published} action={toggleStudySlide} label="Slide" />
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Edit"}
          </Button>
          <DeleteButton
            label="Slide"
            onConfirm={async () => {
              const res = await deleteStudySlide(slide.id);
              if ("error" in res && res.error) return toast.error(res.error);
              toast.success("Slide deleted");
              router.refresh();
            }}
          />
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
            <Input
              type="number"
              min={1}
              value={form.slide_number}
              onChange={(e) => setForm((f) => ({ ...f, slide_number: Number(e.target.value) }))}
            />
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <Textarea
            rows={5}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Slide content (markdown)"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={saveSlide} disabled={busy}>
              {busy ? "Saving…" : "Save slide"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => Promise<unknown> }) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant={confirming ? "destructive" : "ghost"}
      size="sm"
      disabled={busy}
      onClick={async () => {
        if (!confirming) {
          setConfirming(true);
          setTimeout(() => setConfirming(false), 3000);
          return;
        }
        setBusy(true);
        await onConfirm();
        setBusy(false);
        setConfirming(false);
      }}
    >
      <AppIcon name="delete" size={15} className="mr-1" />
      {confirming ? "Confirm?" : label}
    </Button>
  );
}
