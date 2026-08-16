"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { UploadUrlField } from "@/components/admin/upload-url-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate } from "@/lib/utils";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  setCourseStatus,
  addLesson,
  updateLesson,
  deleteLesson,
  moveLesson,
} from "@/lib/actions/admin/courses";

export type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  category: string | null;
  difficulty: string;
  duration_hours: number | null;
  is_free: boolean;
  price: number | null;
  status: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  lesson_count: number;
};

export type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  content: string | null;
  video_url: string | null;
  sort_order: number;
  duration_minutes: number | null;
  is_free_preview: boolean;
  created_at: string;
};

type Props = {
  courses: CourseRow[];
  lessonsByCourse: Record<string, LessonRow[]>;
};

type CourseFormState = {
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  duration_hours: string;
  cover_image: string;
  is_free: boolean;
  price: string;
  status: string;
};

type LessonFormState = {
  title: string;
  content: string;
  video_url: string;
  duration_minutes: string;
  is_free_preview: boolean;
};

const emptyForm: CourseFormState = {
  title: "",
  slug: "",
  description: "",
  category: "",
  difficulty: "beginner",
  duration_hours: "",
  cover_image: "",
  is_free: true,
  price: "",
  status: "draft",
};

const emptyLesson: LessonFormState = {
  title: "",
  content: "",
  video_url: "",
  duration_minutes: "",
  is_free_preview: false,
};

const TABS = [
  { id: "all", label: "All" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "archived", label: "Archived" },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#128a3c",
  intermediate: "#b98000",
  advanced: "#c0392b",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function CourseFormDialog({
  open,
  onOpenChange,
  initial,
  lessons,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: CourseRow | null;
  lessons: LessonRow[];
  onSaved: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState("details");
  const [form, setForm] = React.useState<CourseFormState>(emptyForm);
  const [pending, setPending] = React.useState(false);
  const [lessonForm, setLessonForm] = React.useState<LessonFormState>(emptyLesson);
  const [editingLesson, setEditingLesson] = React.useState<LessonRow | null>(null);
  const [lessonPending, setLessonPending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab("details");
      setForm(
        initial
          ? {
              title: initial.title,
              slug: initial.slug,
              description: initial.description ?? "",
              category: initial.category ?? "",
              difficulty: initial.difficulty,
              duration_hours: initial.duration_hours != null ? String(initial.duration_hours) : "",
              cover_image: initial.cover_image ?? "",
              is_free: initial.is_free,
              price: initial.price != null ? String(initial.price) : "",
              status: initial.status,
            }
          : emptyForm,
      );
      setEditingLesson(null);
      setLessonForm(emptyLesson);
    }
  }, [open, initial]);

  const set = (patch: Partial<CourseFormState>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (form.title.trim().length < 2) {
      toast.error("Title is required");
      return;
    }
    setPending(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      difficulty: form.difficulty as "beginner" | "intermediate" | "advanced",
      duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      cover_image: form.cover_image.trim() || null,
      is_free: form.is_free,
      price: form.price ? Number(form.price) : null,
      status: form.status as "draft" | "published" | "archived",
    };
    const res = initial
      ? await updateCourse(initial.id, payload)
      : await createCourse(payload);
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not save course");
      return;
    }
    toast.success(initial ? "Course updated" : "Course created");
    onOpenChange(false);
    router.refresh();
    onSaved();
  };

  const saveLesson = async () => {
    if (!initial) {
      toast.error("Save the course first, then add lessons.");
      return;
    }
    if (lessonForm.title.trim().length < 2) {
      toast.error("Lesson title is required");
      return;
    }
    setLessonPending(true);
    const payload = {
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim() || null,
      video_url: lessonForm.video_url.trim() || null,
      duration_minutes: lessonForm.duration_minutes ? Number(lessonForm.duration_minutes) : null,
      is_free_preview: lessonForm.is_free_preview,
    };
    const res = editingLesson
      ? await updateLesson(editingLesson.id, payload)
      : await addLesson(initial.id, payload);
    setLessonPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not save lesson");
      return;
    }
    toast.success(editingLesson ? "Lesson updated" : "Lesson added");
    setEditingLesson(null);
    setLessonForm(emptyLesson);
    router.refresh();
    onSaved();
  };

  const removeLesson = async (id: string) => {
    const res = await deleteLesson(id);
    if (!res.ok) toast.error(res.error || "Could not delete lesson");
    else {
      toast.success("Lesson deleted");
      router.refresh();
      onSaved();
    }
    return res;
  };

  const editLesson = (l: LessonRow) => {
    setEditingLesson(l);
    setTab("lessons");
    setLessonForm({
      title: l.title,
      content: l.content ?? "",
      video_url: l.video_url ?? "",
      duration_minutes: l.duration_minutes != null ? String(l.duration_minutes) : "",
      is_free_preview: l.is_free_preview,
    });
  };

  const reorder = async (id: string, direction: "up" | "down") => {
    const res = await moveLesson(id, direction);
    if (!res.ok) toast.error(res.error || "Could not reorder");
    else {
      router.refresh();
      onSaved();
    }
  };

  const sortedLessons = [...lessons].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit course" : "New course"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update course details and manage its lessons." : "Create a course. Changes to published courses can trigger update notifications."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">📘 Course details</TabsTrigger>
            <TabsTrigger value="lessons" disabled={!initial}>
              📚 Lessons {initial ? `(${lessons.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="auto-generated" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Web Development" />
              </div>
              <div className="space-y-2">
                <Label>Cover image (URL or upload)</Label>
                <UploadUrlField value={form.cover_image} onChange={(v) => set({ cover_image: v })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => set({ difficulty: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Input type="number" min={0} step="0.5" value={form.duration_hours} onChange={(e) => set({ duration_hours: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-semibold">Free course</p>
                <p className="text-xs text-muted-foreground">Mark as a 100% free course.</p>
              </div>
              <Switch checked={form.is_free} onCheckedChange={(v) => set({ is_free: v })} />
            </div>
            {!form.is_free && (
              <div className="space-y-2">
                <Label>Price (USD)</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set({ price: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="lessons" className="mt-4 space-y-4">
            {/* Lesson list */}
            <div className="space-y-2">
              <h4 className="font-display text-sm font-bold">Lessons ({sortedLessons.length})</h4>
              {sortedLessons.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No lessons yet — add your first one below.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sortedLessons.map((l, i) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      {/* Reorder buttons */}
                      <div className="flex shrink-0 flex-col">
                        <button
                          type="button"
                          onClick={() => reorder(l.id, "up")}
                          disabled={i === 0}
                          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-accent-hover hover:text-foreground disabled:opacity-30"
                          title="Move up"
                        >
                          <AppIcon name="arrowUpRight" size={12} className="rotate-[-45deg]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => reorder(l.id, "down")}
                          disabled={i === sortedLessons.length - 1}
                          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-accent-hover hover:text-foreground disabled:opacity-30"
                          title="Move down"
                        >
                          <AppIcon name="arrowUpRight" size={12} className="rotate-[135deg]" />
                        </button>
                      </div>

                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.title}</p>
                        <p className="flex flex-wrap items-center gap-x-2 truncate text-xs text-muted-foreground">
                          <span>{l.video_url ? "🎬 video" : "📝 text"}</span>
                          {l.duration_minutes ? <span>· {l.duration_minutes} min</span> : null}
                          {l.is_free_preview ? <Badge variant="gold" className="text-[10px]">Free preview</Badge> : null}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="outline" onClick={() => editLesson(l)}>Edit</Button>
                        <DeleteButton itemId={l.id} onDelete={(id) => removeLesson(id)} label="lesson" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add / edit lesson form */}
            <div className="space-y-2 rounded-lg border bg-card p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {editingLesson ? `Edit lesson: ${editingLesson.title}` : "Add a new lesson"}
              </p>
              <Input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} placeholder="Lesson title" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="Video URL (optional)" />
                <Input type="number" min={0} value={lessonForm.duration_minutes} onChange={(e) => setLessonForm((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="Duration (min, optional)" />
              </div>
              <Textarea rows={2} value={lessonForm.content} onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))} placeholder="Lesson content (optional)" />
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Free preview</p>
                  <p className="text-xs text-muted-foreground">Allow non-enrolled users to preview this lesson.</p>
                </div>
                <Switch checked={lessonForm.is_free_preview} onCheckedChange={(v) => setLessonForm((f) => ({ ...f, is_free_preview: v }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveLesson} disabled={lessonPending}>
                  {lessonPending ? "Saving…" : editingLesson ? "Save lesson" : "Add lesson"}
                </Button>
                {editingLesson && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingLesson(null); setLessonForm(emptyLesson); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save course"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CourseManager({ courses, lessonsByCourse }: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState("all");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CourseRow | null>(null);

  const filtered = courses.filter((c) => {
    if (!c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (tab === "free") return c.is_free;
    if (tab === "paid") return !c.is_free;
    if (tab === "published") return c.status === "published";
    if (tab === "draft") return c.status === "draft";
    if (tab === "archived") return c.status === "archived";
    return true;
  });

  const refresh = () => router.refresh();

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (c: CourseRow) => {
    setEditing(c);
    setEditorOpen(true);
  };

  const changeStatus = async (c: CourseRow, status: "draft" | "published" | "archived") => {
    const res = await setCourseStatus(c.id, status);
    if (!res.ok) toast.error(res.error || "Could not update status");
    else {
      toast.success(`Course ${status}`);
      refresh();
    }
  };

  // Stats
  const total = courses.length;
  const free = courses.filter((c) => c.is_free).length;
  const paid = courses.filter((c) => !c.is_free).length;
  const published = courses.filter((c) => c.status === "published").length;
  const lessonTotal = Object.values(lessonsByCourse).reduce((n, ls) => n + ls.length, 0);

  const stats = [
    { label: "Total courses", value: total, icon: "layers" as const, tint: "#7464c6" },
    { label: "Free", value: free, icon: "star" as const, tint: "#128a3c" },
    { label: "Paid", value: paid, icon: "dollar" as const, tint: "#b98000" },
    { label: "Published", value: published, icon: "check" as const, tint: "#5f4fa8" },
    { label: "Lessons", value: lessonTotal, icon: "file" as const, tint: "#7464c6" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg" style={{ background: `${s.tint}14`, color: s.tint }}>
                <AppIcon name={s.icon} size={17} />
              </span>
              <span className="font-display text-2xl font-extrabold tabular-nums" style={{ color: s.tint }}>
                {s.value}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <AppIcon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" className="pl-9" />
        </div>
        <Button variant="gold" onClick={openNew}>
          <AppIcon name="plus" size={16} /> New course
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
              No courses in this view.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onEdit={() => openEdit(c)}
                  onChangeStatus={(s) => changeStatus(c, s)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CourseFormDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={editing}
        lessons={editing ? lessonsByCourse[editing.id] ?? [] : []}
        onSaved={refresh}
      />
    </div>
  );
}

/* ── Individual course card ─────────────────────────────────────────── */

function CourseCard({
  course: c,
  onEdit,
  onChangeStatus,
}: {
  course: CourseRow;
  onEdit: () => void;
  onChangeStatus: (s: "draft" | "published" | "archived") => void;
}) {
  const diffColor = DIFFICULTY_COLOR[c.difficulty] ?? "#7464c6";
  const diffLabel = DIFFICULTY_LABEL[c.difficulty] ?? c.difficulty;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {c.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.cover_image}
            alt={c.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center" style={{ background: "linear-gradient(135deg, #7464c6 0%, #4b3ea1 100%)" }}>
            <AppIcon name="layers" size={40} className="text-white/40" />
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge variant={c.is_free ? "gold" : "default"}>{c.is_free ? "Free" : "Paid"}</Badge>
        </div>
        <div className="absolute right-3 top-3">
          <Badge
            variant={c.status === "published" ? "default" : c.status === "draft" ? "secondary" : "outline"}
            className="bg-background/80 backdrop-blur"
          >
            {c.status}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display line-clamp-2 text-base font-bold leading-snug">{c.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md px-2 py-0.5 font-semibold" style={{ color: diffColor, background: `${diffColor}14` }}>
            {diffLabel}
          </span>
          {c.category ? <span>{c.category}</span> : null}
          {c.duration_hours ? <span>· {c.duration_hours}h</span> : null}
          <span>· {c.lesson_count} lesson{c.lesson_count === 1 ? "" : "s"}</span>
        </div>
        {c.description ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <span className="text-xs text-muted-foreground">Updated {formatDate(c.updated_at)}</span>
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
            {c.status === "published" ? (
              <Button size="sm" variant="outline" onClick={() => onChangeStatus("draft")}>Unpublish</Button>
            ) : c.status === "draft" ? (
              <Button size="sm" onClick={() => onChangeStatus("published")}>Publish</Button>
            ) : null}
            {c.status === "archived" ? (
              <Button size="sm" variant="outline" onClick={() => onChangeStatus("draft")}>Restore</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onChangeStatus("archived")}>Archive</Button>
            )}
            <DeleteButton itemId={c.id} onDelete={(id) => deleteCourse(id)} label="course" />
          </div>
        </div>
      </div>
    </div>
  );
}
