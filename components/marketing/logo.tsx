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
      className={cn("flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          markClassName
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 18V7l5 7 3-4 3 4 5-7v11"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Marwat<span className="text-primary">Tech</span>
      </span>
    </Link>
  );
}
