"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/client", icon: "dashboard" as const },
  { label: "My Projects", href: "/client/projects", icon: "rocket" as const },
  { label: "Payments", href: "/client/payments", icon: "dollar" as const },
  { label: "Support Tickets", href: "/client/tickets", icon: "chat" as const },
  { label: "Courses", href: "/client/courses", icon: "grid" as const },
  { label: "Study Materials", href: "/client/materials", icon: "file" as const },
];

export function ClientShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email?: string; full_name: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const db = createClient();
    await db.auth.signOut();
    toast.success("Signed out");
    router.push("/client/login");
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-background lg:flex lg:flex-col">
        <div className="border-b px-5 py-4">
          <Logo markClassName="size-8" className="[&>span:last-child]:text-base" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = item.href === "/client" ? pathname === "/client" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
                )}
              >
                <AppIcon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent-hover"
          >
            <AppIcon name="globe" size={18} />
            View site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Badge variant="gold" className="uppercase tracking-wide">
            Client Portal
          </Badge>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user.full_name ?? "Client"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {initials(user.full_name ?? "C")}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
              <AppIcon name="logout" size={16} />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background px-2 py-1.5 lg:hidden">
        {NAV.map((item) => {
          const active = item.href === "/client" ? pathname === "/client" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <AppIcon name={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
