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
      {/* Light mode logo */}
      <img
        src="/assets/logo-light.svg"
        alt="Marwat Tech"
        className="h-9 w-auto dark:hidden"
      />
      {/* Dark mode logo */}
      <img
        src="/assets/logo-dark.svg"
        alt="Marwat Tech"
        className="hidden h-9 w-auto dark:block"
      />
    </Link>
  );
}
