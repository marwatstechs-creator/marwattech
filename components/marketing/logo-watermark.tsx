import { cn } from "@/lib/utils";

/**
 * Faded brand logo used as a low-opacity watermark inside card surfaces.
 *
 * Theme-aware without JS (no hydration flash):
 * - Light-mode square logo in day mode
 * - Dark-mode square logo in night mode
 *
 * Place inside a `relative overflow-hidden` parent. Size/position via `className`.
 */
export function LogoWatermark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-0 select-none overflow-hidden",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo-light-square.svg"
        alt=""
        className="h-full w-full object-contain opacity-[0.07] dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo-dark-square.svg"
        alt=""
        className="hidden h-full w-full object-contain opacity-[0.06] dark:block"
      />
    </span>
  );
}
