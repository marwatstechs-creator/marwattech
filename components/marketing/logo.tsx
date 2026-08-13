import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
  responsive = false,
}: {
  className?: string;
  markClassName?: string;
  responsive?: boolean;
}) {
  const alwaysMark = Boolean(markClassName) && !responsive;
  const showMark = alwaysMark || responsive;

  return (
    <Link
      href="/"
      aria-label="Marwat Tech — Home"
      className={cn("flex shrink-0 items-center", className)}
    >
      {/* Square logo mark (circle on mobile navbar, rounded box elsewhere) */}
      {showMark && (
        <span
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden border bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10",
            responsive ? "rounded-full lg:hidden" : "rounded-xl",
            markClassName ?? "size-9"
          )}
        >
          <img
            src="/assets/logo-light-square.svg"
            alt=""
            className="h-full w-full object-contain p-0.5 dark:hidden"
          />
          <img
            src="/assets/logo-dark-square.svg"
            alt=""
            className="hidden h-full w-full object-contain p-0.5 dark:block"
          />
        </span>
      )}

      {/* Horizontal logo with text (default + desktop navbar) */}
      {!alwaysMark && (
        <span className={cn("flex items-center", responsive && "hidden lg:block")}>
          <img
            src="/assets/logo-light.svg"
            alt="Marwat Tech"
            className="h-9 w-auto dark:hidden"
          />
          <img
            src="/assets/logo-dark.svg"
            alt="Marwat Tech"
            className="hidden h-9 w-auto dark:block"
          />
        </span>
      )}
    </Link>
  );
}
