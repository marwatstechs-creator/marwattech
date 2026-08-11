import { Logo } from "@/components/marketing/logo";
import { AuthWaves } from "@/components/marketing/auth-waves";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,hsl(var(--brand)/0.1),transparent)]"
      />
      <AuthWaves />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
