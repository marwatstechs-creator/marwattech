"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
import { AvatarMenu } from "@/components/profile/avatar-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CollapsibleSidebar, type CollapsibleSidebarItem } from "@/components/admin/collapsible-sidebar";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

type NavItem = {
  label: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
  roles: UserRole[];
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard", roles: ["super_admin", "editor", "support"] },
  { label: "My Profile", href: "/admin/profile", icon: "edit", roles: ["super_admin", "editor", "support"] },
  { label: "Clients", href: "/admin/clients", icon: "userAdd", roles: ["super_admin", "editor"] },
  { label: "Projects", href: "/admin/projects", icon: "briefcase", roles: ["super_admin", "editor"] },
  { label: "Services", href: "/admin/services", icon: "code", roles: ["super_admin", "editor"] },
  { label: "Portfolio", href: "/admin/portfolio", icon: "layers", roles: ["super_admin", "editor"] },
  { label: "Blog", href: "/admin/blog", icon: "file", roles: ["super_admin", "editor"] },
  { label: "Pages", href: "/admin/pages", icon: "document", roles: ["super_admin", "editor"] },
  { label: "Testimonials", href: "/admin/testimonials", icon: "quote", roles: ["super_admin", "editor"] },
  { label: "Careers", href: "/admin/careers", icon: "briefcase", roles: ["super_admin", "editor"] },
  { label: "Applications", href: "/admin/applications", icon: "userAdd", roles: ["super_admin", "editor"] },
  { label: "Messages", href: "/admin/messages", icon: "message", roles: ["super_admin", "editor", "support"] },
  { label: "Payments", href: "/admin/payments", icon: "wallet", roles: ["super_admin", "editor", "support"] },
  { label: "Marketing", href: "/admin/marketing", icon: "megaphone", roles: ["super_admin", "editor"] },
  { label: "Courses", href: "/admin/courses", icon: "layers", roles: ["super_admin", "editor"] },
  { label: "Course Updates", href: "/admin/course-updates", icon: "bell", roles: ["super_admin", "editor"] },
  { label: "AdSense Ads", href: "/admin/ads", icon: "tag", roles: ["super_admin", "editor"] },
  { label: "Study Materials", href: "/admin/study-materials", icon: "folder", roles: ["super_admin", "editor"] },
  { label: "Promo Codes", href: "/admin/promo-codes", icon: "dollar", roles: ["super_admin", "editor"] },
  { label: "Media Library", href: "/admin/media", icon: "image", roles: ["super_admin", "editor"] },
  { label: "Settings", href: "/admin/settings", icon: "settings", roles: ["super_admin"] },
  { label: "Users", href: "/admin/users", icon: "team", roles: ["super_admin"] },
  { label: "Client Users", href: "/admin/users/clients", icon: "team", roles: ["super_admin"] },
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
                "nav-item-3d flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
          className="nav-item-3d flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent-hover"
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
  user: { email?: string; full_name: string | null; role: UserRole; avatar_url?: string | null };
}) {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restore the pinned state on mount (localStorage).
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("mts-admin-sidebar");
      if (v) setPinned(v === "1");
    } catch {
      // ignore
    }
  }, []);

  const togglePin = () => {
    setPinned((p) => {
      const next = !p;
      try {
        window.localStorage.setItem("mts-admin-sidebar", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const items: CollapsibleSidebarItem[] = NAV.filter((n) =>
    n.roles.includes(user.role)
  ).map(({ label, href, icon }) => ({ label, href, icon }));

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop collapsible sidebar */}
      <CollapsibleSidebar
        items={items}
        isActive={isActive}
        pinned={pinned}
        onOpenChange={setSidebarOpen}
        footer={(open) => (
          <Link
            href="/"
            target="_blank"
            title={!open ? "View site" : undefined}
            className={cn(
              "nav-item-3d flex items-center rounded-lg text-sm font-medium text-foreground/70 transition-colors hover:bg-accent-hover hover:text-foreground",
              open ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
            )}
          >
            <AppIcon name="globe" size={18} className="shrink-0" />
            {open && <span className="truncate whitespace-nowrap">View site</span>}
            {open && <AppIcon name="external" size={14} className="ml-auto opacity-50" />}
          </Link>
        )}
      />

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="topbar-3d glass-strong sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle (desktop) — menu icon becomes close when open */}
            <div className="hidden lg:block">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePin}
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <AppIcon name={sidebarOpen ? "close" : "menu"} size={20} />
              </Button>
            </div>
            {/* Mobile menu */}
            <div className="lg:hidden">
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
            </div>

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
            <AvatarMenu
              user={user}
              profileHref="/admin/profile"
              settingsHref={user.role === "super_admin" ? "/admin/settings" : undefined}
              signOutHref="/admin/login"
              onSignedOut={() => trackEvent("admin_sign_out")}
            />
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
