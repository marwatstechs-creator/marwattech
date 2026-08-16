"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnrollButton } from "@/components/client/enroll-button";
import { LessonPlayer } from "@/components/client/lesson-player";
import { setLessonProgress } from "@/lib/actions/client/courses";
import { cn, formatDuration } from "@/lib/utils";

export type PlayerLesson = {
  id: string;
  title: string;
  content: string | null;
  has_video: boolean;
  duration_hours: number | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  is_free_preview: boolean;
};

export function CoursePlayer({
  courseId,
  courseTitle,
  difficulty,
  durationHours,
  enrolled,
  lessons,
  initialProgress,
}: {
  courseId: string;
  courseTitle: string;
  difficulty: string;
  durationHours: number | null;
  enrolled: boolean;
  lessons: PlayerLesson[];
  initialProgress: Record<string, boolean>;
}) {
  const [activeId, setActiveId] = React.useState<string | null>(() => {
    const firstVideo = lessons.find((l) => l.has_video);
    return (firstVideo ?? lessons[0])?.id ?? null;
  });
  const [progress, setProgress] = React.useState<Record<string, boolean>>(initialProgress);
  const [marking, setMarking] = React.useState(false);
  const playerRef = React.useRef<HTMLDivElement>(null);

  const active = lessons.find((l) => l.id === activeId) ?? null;
  const completedCount = lessons.filter((l) => progress[l.id]).length;

  const isLocked = (l: PlayerLesson) => !enrolled && !l.is_free_preview;

  const selectLesson = (l: PlayerLesson) => {
    if (isLocked(l)) {
      toast.error("Enroll in this course to access this lesson.");
      return;
    }
    setActiveId(l.id);
    // Give React a tick to render the new lesson before scrolling.
    requestAnimationFrame(() =>
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const markComplete = async (lessonId: string, completed: boolean) => {
    if (!enrolled) return;
    setMarking(true);
    setProgress((p) => ({ ...p, [lessonId]: completed }));
    const res = await setLessonProgress(lessonId, completed);
    setMarking(false);
    if (!res.ok) {
      setProgress((p) => ({ ...p, [lessonId]: !completed }));
      return toast.error(res.error || "Could not save progress.");
    }
    toast.success(completed ? "Lesson marked complete" : "Lesson marked incomplete");
  };

  return (
    <div className="space-y-6">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={difficulty === "advanced" ? "destructive" : "default"} className="capitalize">
          {difficulty}
        </Badge>
        {durationHours ? (
          <span className="text-sm text-muted-foreground">{durationHours}h total</span>
        ) : null}
        {enrolled ? <Badge variant="default">Enrolled</Badge> : null}
        <span className="ml-auto text-sm text-muted-foreground">
          {completedCount}/{lessons.length} completed
        </span>
      </div>

      {/* Enroll banner */}
      {!enrolled && (
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-medium">You are not enrolled in this course yet.</p>
              <p className="text-sm text-muted-foreground">
                Enroll now to unlock every lesson, video and progress tracking.
              </p>
            </div>
            <EnrollButton courseId={courseId} />
          </CardContent>
        </Card>
      )}

      {/* Player */}
      <div ref={playerRef} className="scroll-mt-24 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold leading-snug">
              {active?.title ?? courseTitle}
            </h2>
            {active && formatDuration(active.duration_hours, active.duration_minutes, active.duration_seconds) ? (
              <p className="text-sm text-muted-foreground">
                {formatDuration(active.duration_hours, active.duration_minutes, active.duration_seconds)}
              </p>
            ) : null}
          </div>
          {enrolled && active && (
            <Button
              variant={progress[active.id] ? "default" : "outline"}
              size="sm"
              onClick={() => markComplete(active.id, !progress[active.id])}
              disabled={marking}
              className="shrink-0"
            >
              <AppIcon name={progress[active.id] ? "check" : "checkLine"} size={15} className="mr-1.5" />
              {progress[active.id] ? "Completed" : "Mark complete"}
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          {active ? (
            <LessonPlayer key={active.id} lessonId={active.id} onEnded={() => markComplete(active.id, true)} />
          ) : null}
        </div>

        {enrolled && active?.content && (
          <div
            className="prose-cms rounded-xl border bg-card p-5 text-sm"
            // content is sanitized server-side before it reaches this component
            dangerouslySetInnerHTML={{ __html: active.content }}
          />
        )}
      </div>

      {/* Lesson list */}
      <div className="space-y-2">
        <h3 className="font-display text-lg font-semibold">Lessons ({lessons.length})</h3>
        {lessons.map((l, i) => {
          const done = progress[l.id];
          const locked = isLocked(l);
          const isActive = l.id === active?.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => selectLesson(l)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-colors",
                isActive ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/30 hover:bg-accent/40",
                locked && "opacity-60"
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                  done
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <AppIcon name="check" size={16} /> : locked ? <AppIcon name="lock" size={15} /> : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-medium">{l.title}</h4>
                  {l.is_free_preview && <Badge variant="gold" className="text-[10px]">Free preview</Badge>}
                  {done && <Badge variant="default" className="text-[10px]">Done</Badge>}
                </div>
                {formatDuration(l.duration_hours, l.duration_minutes, l.duration_seconds) && (
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(l.duration_hours, l.duration_minutes, l.duration_seconds)}
                  </p>
                )}
              </div>

              {!locked && l.has_video && (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <AppIcon name="play" size={18} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
