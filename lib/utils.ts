import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date as e.g. "Aug 10, 2026" (fixed UTC — deterministic across
 * server and client so it can never cause a React hydration mismatch). */
export function formatDate(
  date: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(date));
}

/** Format a date + time as e.g. "Aug 10, 2026, 6:05 PM UTC" (deterministic UTC). */
export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(date));
}

/** Relative time e.g. "just now", "5m ago", "2h ago", "3d ago" (deterministic-ish).
 * Falls back to formatDate for anything older than 30 days to avoid drift. */
export function timeAgo(date: string | Date | null | undefined) {
  if (!date) return "";
  const then = new Date(date).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/**
 * Format a duration from hours / minutes / seconds parts, e.g.
 * "1h 5m 30s", "5m", or "" when nothing is set. Omits zero leading units
 * (30 seconds → "30s", not "0h 0m 30s").
 */
export function formatDuration(
  hours?: number | null,
  minutes?: number | null,
  seconds?: number | null
) {
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);
  return parts.join(" ");
}

/** Convert arbitrary text into a URL-safe slug. */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Estimate reading time in minutes from rich-text HTML. */
export function readingTime(content: string) {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").length;
  return Math.max(1, Math.round(words / 200));
}

/** Truncate a string to a maximum number of characters. */
export function truncate(text: string, max = 140) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

/** Strip HTML tags, useful for excerpts / meta descriptions. */
export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marwattech.com";
  return new URL(path, base).toString();
}
