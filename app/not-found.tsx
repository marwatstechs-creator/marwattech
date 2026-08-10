import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Logo className="mb-10" />
      <p className="font-display text-7xl font-extrabold text-primary sm:text-8xl">
        404
      </p>
      <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or has been moved. Let’s get
        you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button size="lg">
            <AppIcon name="home" size={16} />
            Back to Home
          </Button>
        </Link>
        <Link href="/contact">
          <Button size="lg" variant="outline">
            Contact Us
          </Button>
        </Link>
      </div>
    </div>
  );
}
