"use client";

import * as React from "react";

const WORDS = ["Growth", "Results", "Impact", "Success", "Innovation"];

const TYPE_MS = 90; // ms per character while typing
const DELETE_MS = 45; // ms per character while deleting
const HOLD_MS = 2000; // how long the full word stays visible
const REST_MS = 350; // brief pause before the next word starts typing

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Rotating word with a smooth type / hold / delete animation and a blinking
 * caret (agency-hero style).
 *
 * - Reserves the width of the longest word so the headline never shifts.
 * - Respects `prefers-reduced-motion`: renders the first word statically.
 * - Accessible: the animated text is decorative; an sr-only line lists every
 *   word so screen readers get the full headline.
 */
export function Typewriter({
  words = WORDS,
  className,
}: {
  words?: string[];
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);

  const longest = React.useMemo(
    () => words.reduce((a, b) => (b.length > a.length ? b : a), words[0] ?? ""),
    [words]
  );

  React.useEffect(() => {
    if (reduced) return;
    const word = words[index];
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!deleting) {
      // Type a character, or hold the full word before deleting.
      timer = setTimeout(
        () => {
          if (count < word.length) setCount((c) => c + 1);
          else setDeleting(true);
        },
        count < word.length ? TYPE_MS : HOLD_MS
      );
    } else {
      // Delete a character, then move on to the next word.
      timer = setTimeout(
        () => {
          if (count > 0) setCount((c) => c - 1);
          else {
            setDeleting(false);
            setIndex((i) => (i + 1) % words.length);
          }
        },
        count > 0 ? DELETE_MS : REST_MS
      );
    }

    return () => clearTimeout(timer);
  }, [index, count, deleting, words, reduced]);

  const visible = reduced ? words[0] : words[index].slice(0, count);

  return (
    <>
      {/* Invisible longest word reserves width → no layout shift */}
      <span className={`relative inline-block text-left ${className ?? ""}`}>
        <span aria-hidden="true" className="invisible whitespace-pre">
          {longest}
        </span>
        <span aria-hidden="true" className="absolute inset-y-0 left-0 whitespace-nowrap">
          {visible}
          <span className="caret-blink ml-0.5 inline-block h-[0.82em] w-[3px] translate-y-[0.14em] rounded-[1px] bg-foreground" />
        </span>
      </span>
      {/* Full static text for assistive tech */}
      <span className="sr-only">{words.join(" · ")}</span>
    </>
  );
}
