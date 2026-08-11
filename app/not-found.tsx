import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <Logo className="mb-8" />
      {/* Animated 404 illustration */}
      <img
        src="/assets/error-404.svg"
        alt="404 error illustration"
        className="h-auto w-full max-w-[380px] sm:max-w-[460px]"
      />
      <h1 className="font-display mt-8 text-2xl font-bold sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or has been moved. Let’s get
        you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button size="lg" className="whitespace-nowrap">
            <AppIcon name="home" size={16} />
            Back to Home
          </Button>
        </Link>
        <Link href="/contact">
          <Button size="lg" variant="outline" className="whitespace-nowrap">
            Contact Us
          </Button>
        </Link>
      </div>
    </div>
  );
}
