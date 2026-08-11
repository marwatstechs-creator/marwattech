"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { cn, initials } from "@/lib/utils";
import type { UserRole } from "@/types/database";

type NavItem = {
  label: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
  roles: UserRole[];
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard", roles: ["super_admin", "editor", "support"] },
  { label: "Services", href: "/admin/services", icon: "code", roles: ["super_admin", "editor"] },
  { label: "Portfolio", href: "/admin/portfolio", icon: "layers", roles: ["super_admin", "editor"] },
  { label: "Blog", href: "/admin/blog", icon: "file", roles: ["super_admin", "editor"] },
  { label: "Testimonials", href: "/admin/testimonials", icon: "quote", roles: ["super_admin", "editor"] },
  { label: "Careers", href: "/admin/careers", icon: "briefcase", roles: ["super_admin", "editor"] },
  { label: "Applications", href: "/admin/applications", icon: "userAdd", roles: ["super_admin", "editor"] },
  { label: "Messages", href: "/admin/messages", icon: "message", roles: ["super_admin", "editor", "support"] },
  { label: "Media Library", href: "/admin/media", icon: "image", roles: ["super_admin", "editor"] },
  { label: "Settings", href: "/admin/settings", icon: "settings", roles: ["super_admin"] },
  { label: "Users", href: "/admin/users", icon: "team", roles: ["super_admin"] },
  { label: "Clients", href: "/admin/users/clients", icon: "team", roles: ["super_admin"] },
];

function SidebarContent({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <Logo markClassName="size-8" className="[&>span:last-child]:text-base" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
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
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent"
        >
          <AppIcon name="globe" size={18} />
          View site
          <AppIcon name="external" size={14} className="ml-auto opacity-50" />
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email?: string; full_name: string | null; role: UserRole };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const db = createClient();
    await db.auth.signOut();
    trackEvent("admin_sign_out");
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-background lg:block">
        <SidebarContent role={user.role} />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open admin menu">
                  <AppIcon name="menu" size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin menu</SheetTitle>
                </SheetHeader>
                <SidebarContent role={user.role} onNavigate={() => undefined} />
              </SheetContent>
            </Sheet>

            <div className="hidden sm:block">
              <Badge variant="gold" className="uppercase tracking-wide">
                Admin
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">{user.full_name ?? "Admin"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {initials(user.full_name ?? "A")}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <AppIcon name="logout" size={16} />
              <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8" key={pathname}>
          {children}
        </main>
      </div>
    </div>
  );
}
