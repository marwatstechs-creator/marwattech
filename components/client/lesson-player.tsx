"use client";

import * as React from "react";

import { AppIcon } from "@/components/app-icon";
import { getLessonPlayback } from "@/lib/actions/client/courses";

type Playback =
  | { ok: true; kind: "youtube" | "drive" | "other"; src: string | null }
  | { ok: false; error: string };

/**
 * In-page video player. Resolves the playback source via a server action the
 * moment a lesson is opened — the raw video URL is never shipped to the
 * client. YouTube plays as a minimal (label-free) nocookie embed; Google Drive
 * streams through our media proxy. Calls `onEnded` so the parent can mark the
 * lesson complete.
 */
export function LessonPlayer({
  lessonId,
  onEnded,
  autoPlay = true,
}: {
  lessonId: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}) {
  const [playback, setPlayback] = React.useState<Playback | null>(null);
  const [loading, setLoading] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPlayback(null);
    getLessonPlayback(lessonId)
      .then((res) => {
        if (cancelled) return;
        setPlayback(res);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPlayback({ ok: false, error: "Could not load the video." });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {loading && (
        <div className="absolute inset-0 grid place-items-center">
          <AppIcon name="refresh" size={28} className="animate-spin text-white/70" />
        </div>
      )}

      {!loading && playback && !playback.ok && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <p className="text-sm text-white/80">{playback.error}</p>
        </div>
      )}

      {!loading && playback?.ok && playback.kind === "youtube" && playback.src && (
        <iframe
          src={playback.src}
          title="Lesson video"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}

      {!loading && playback?.ok && playback.kind === "drive" && playback.src && (
        <video
          ref={videoRef}
          key={playback.src}
          src={playback.src}
          className="absolute inset-0 h-full w-full"
          controls
          playsInline
          autoPlay={autoPlay}
          onEnded={() => onEnded?.()}
        />
      )}

      {!loading && playback?.ok && playback.kind === "other" && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <p className="text-sm text-white/70">No video for this lesson.</p>
        </div>
      )}
    </div>
  );
}
