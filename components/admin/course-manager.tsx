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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const TABS = [
  { id: "all", label: "All" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "archived", label: "Archived" },
];

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
  const [form, setForm] = React.useState<CourseFormState>(emptyForm);
  const [pending, setPending] = React.useState(false);
  const [lessonForm, setLessonForm] = React.useState({ title: "", content: "", video_url: "" });
  const [editingLesson, setEditingLesson] = React.useState<LessonRow | null>(null);
  const [lessonPending, setLessonPending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
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
      setLessonForm({ title: "", content: "", video_url: "" });
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
    if (lessonForm.title.trim().length < 2 || !initial) return;
    setLessonPending(true);
    const payload = {
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim() || null,
      video_url: lessonForm.video_url.trim() || null,
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
    setLessonForm({ title: "", content: "", video_url: "" });
    router.refresh();
  };

  const removeLesson = async (id: string) => {
    const res = await deleteLesson(id);
    if (!res.ok) toast.error(res.error || "Could not delete lesson");
    else {
      toast.success("Lesson deleted");
      router.refresh();
    }
  };

  const editLesson = (l: LessonRow) => {
    setEditingLesson(l);
    setLessonForm({ title: l.title, content: l.content ?? "", video_url: l.video_url ?? "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit course" : "New course"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update course details and lessons." : "Create a course. Changes to published courses can trigger update notifications."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
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
        </div>

        {/* Lessons */}
        {initial && (
          <div className="mt-2 space-y-3 border-t pt-4">
            <h4 className="font-display text-sm font-bold">Lessons ({lessons.length})</h4>
            {lessons.length > 0 && (
              <div className="space-y-1.5">
                {lessons.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{l.sort_order}. {l.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.video_url ? "🎬 video" : "📝 text"} · {l.duration_minutes ?? 0} min</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" onClick={() => editLesson(l)}>Edit</Button>
                      <DeleteButton itemId={l.id} onDelete={(id) => deleteLesson(id)} label="lesson" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {editingLesson ? `Edit lesson: ${editingLesson.title}` : "Add a lesson"}
              </p>
              <Input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} placeholder="Lesson title" />
              <Input value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="Video URL (optional)" />
              <Textarea rows={2} value={lessonForm.content} onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))} placeholder="Lesson content (optional)" />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveLesson} disabled={lessonPending}>
                  {lessonPending ? "Saving…" : editingLesson ? "Save lesson" : "Add lesson"}
                </Button>
                {editingLesson && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingLesson(null); setLessonForm({ title: "", content: "", video_url: "" }); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

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

  return (
    <div className="space-y-4">
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
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lessons</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No courses in this view.</TableCell></TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-[260px]">
                        <p className="truncate font-medium">{c.title}</p>
                        <p className="truncate text-xs text-muted-foreground">/{c.slug}{c.category ? ` · ${c.category}` : ""}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_free ? "gold" : "default"}>{c.is_free ? "Free" : "Paid"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "published" ? "default" : c.status === "draft" ? "secondary" : "outline"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.lesson_count}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(c.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                          {c.status === "published" ? (
                            <Button size="sm" variant="outline" onClick={() => changeStatus(c, "draft")}>Unpublish</Button>
                          ) : c.status === "draft" ? (
                            <Button size="sm" onClick={() => changeStatus(c, "published")}>Publish</Button>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => changeStatus(c, c.status === "archived" ? "draft" : "archived")}>
                            {c.status === "archived" ? "Restore" : "Archive"}
                          </Button>
                          <DeleteButton itemId={c.id} onDelete={(id) => deleteCourse(id)} label="course" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
