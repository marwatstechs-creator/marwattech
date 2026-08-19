"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarMenu } from "@/components/profile/avatar-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CollapsibleSidebar, type CollapsibleSidebarItem } from "@/components/admin/collapsible-sidebar";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/client", icon: "dashboard" as const },
  { label: "My Projects", href: "/client/projects", icon: "rocket" as const },
  { label: "Payments", href: "/client/payments", icon: "dollar" as const },
  { label: "Support Tickets", href: "/client/tickets", icon: "chat" as const },
  { label: "Courses", href: "/client/courses", icon: "grid" as const },
  { label: "Certificates", href: "/client/certificates", icon: "medal" as const },
  { label: "Study Materials", href: "/client/materials", icon: "file" as const },
  { label: "Settings", href: "/client/settings", icon: "settings" as const },
];

export function ClientShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email?: string; full_name: string | null; avatar_url?: string | null };
}) {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem("mts-client-sidebar");
      if (v) setPinned(v === "1");
    } catch {
      // ignore
    }
  }, []);

  const togglePin = () => {
    setPinned((p) => {
      const next = !p;
      try {
        window.localStorage.setItem("mts-client-sidebar", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const items: CollapsibleSidebarItem[] = NAV.map(({ label, href, icon }) => ({
    label,
    href,
    icon,
  }));

  const isActive = (href: string) =>
    href === "/client" ? pathname === "/client" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Collapsible sidebar */}
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
          </Link>
        )}
      />

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="topbar-3d glass-strong sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-4 sm:px-6">
          <div className="flex items-center gap-3">
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
            <Badge variant="gold" className="uppercase tracking-wide">
              Client Portal
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user.full_name ?? "Client"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <AvatarMenu
              user={user}
              profileHref="/client/settings"
              signOutHref="/client/login"
            />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t px-2 py-1.5 lg:hidden">
        {NAV.map((item) => {
          const active = item.href === "/client" ? pathname === "/client" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item-3d flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium",
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
