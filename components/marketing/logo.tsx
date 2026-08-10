import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
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
      {/* Light mode logo (square brand mark) */}
      <img
        src="/assets/logo-light-square.svg"
        alt="Marwat Tech"
        className="h-9 w-auto dark:hidden"
      />
      {/* Dark mode logo (square brand mark) */}
      <img
        src="/assets/logo-dark-square.svg"
        alt="Marwat Tech"
        className="hidden h-9 w-auto dark:block"
      />
    </Link>
  );
}
