import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Marwat Tech — Home"
      className={cn("flex shrink-0 items-center", className)}
    >
      {/* Rounded-square logo mark box */}
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10",
          markClassName
        )}
      >
        <img
          src="/assets/logo-light-square.svg"
          alt="Marwat Tech"
          className="h-full w-full object-contain p-0.5 dark:hidden"
        />
        <img
          src="/assets/logo-dark-square.svg"
          alt="Marwat Tech"
          className="hidden h-full w-full object-contain p-0.5 dark:block"
        />
      </span>
    </Link>
  );
}
