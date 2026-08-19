"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
import { DigitalClock } from "@/components/ui/digital-clock";
import { CollapsibleSidebar, type CollapsibleSidebarItem } from "@/components/admin/collapsible-sidebar";
import { AdminSectionTabs, type SectionTabItem } from "@/components/admin/admin-section-tabs";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

type NavItem = {
  label: string;
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
  roles: UserRole[];
};

type NavGroup = {
  label: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
  roles: UserRole[];
  items: NavItem[];
};

/* ── Grouped navigation: sidebar shows parents, body shows children as tabs ── */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    icon: "dashboard",
    roles: ["super_admin", "editor", "support"],
    items: [
      { label: "Dashboard", href: "/admin", icon: "dashboard", roles: ["super_admin", "editor", "support"] },
      { label: "AI Assistant", href: "/admin/ai", icon: "ai", roles: ["super_admin", "editor"] },
      { label: "My Profile", href: "/admin/profile", icon: "edit", roles: ["super_admin", "editor", "support"] },
    ],
  },
  {
    label: "CRM",
    icon: "userAdd",
    roles: ["super_admin", "editor"],
    items: [
      { label: "Clients", href: "/admin/clients", icon: "userAdd", roles: ["super_admin", "editor"] },
      { label: "Projects", href: "/admin/projects", icon: "briefcase", roles: ["super_admin", "editor"] },
    ],
  },
  {
    label: "Content",
    icon: "layers",
    roles: ["super_admin", "editor"],
    items: [
      { label: "Services", href: "/admin/services", icon: "code", roles: ["super_admin", "editor"] },
      { label: "Portfolio", href: "/admin/portfolio", icon: "layers", roles: ["super_admin", "editor"] },
      { label: "Blog", href: "/admin/blog", icon: "file", roles: ["super_admin", "editor"] },
      { label: "Pages", href: "/admin/pages", icon: "document", roles: ["super_admin", "editor"] },
      { label: "Testimonials", href: "/admin/testimonials", icon: "quote", roles: ["super_admin", "editor"] },
      { label: "Careers", href: "/admin/careers", icon: "briefcase", roles: ["super_admin", "editor"] },
      { label: "Applications", href: "/admin/applications", icon: "userAdd", roles: ["super_admin", "editor"] },
      { label: "Code Scripts", href: "/admin/code-scripts", icon: "code", roles: ["super_admin", "editor"] },
    ],
  },
  {
    label: "Support",
    icon: "chat",
    roles: ["super_admin", "editor", "support"],
    items: [
      { label: "Tickets", href: "/admin/tickets", icon: "chat", roles: ["super_admin", "editor", "support"] },
      { label: "Messages", href: "/admin/messages", icon: "message", roles: ["super_admin", "editor", "support"] },
      { label: "Meetings", href: "/admin/meetings", icon: "calendar", roles: ["super_admin", "editor", "support"] },
    ],
  },
  {
    label: "Payments",
    icon: "wallet",
    roles: ["super_admin", "editor", "support"],
    items: [
      { label: "Payments", href: "/admin/payments", icon: "wallet", roles: ["super_admin", "editor", "support"] },
      { label: "Promo Codes", href: "/admin/promo-codes", icon: "dollar", roles: ["super_admin", "editor"] },
    ],
  },
  {
    label: "Marketing",
    icon: "megaphone",
    roles: ["super_admin", "editor"],
    items: [
      { label: "Marketing", href: "/admin/marketing", icon: "megaphone", roles: ["super_admin", "editor"] },
      { label: "AdSense Ads", href: "/admin/ads", icon: "tag", roles: ["super_admin", "editor"] },
    ],
  },
  {
    label: "Courses",
    icon: "folder",
    roles: ["super_admin", "editor"],
    items: [
      { label: "Courses", href: "/admin/courses", icon: "layers", roles: ["super_admin", "editor"] },
      { label: "Course Updates", href: "/admin/course-updates", icon: "bell", roles: ["super_admin", "editor"] },
      { label: "Study Platform", href: "/admin/study-platform", icon: "folder", roles: ["super_admin", "editor"] },
      { label: "Study Materials", href: "/admin/study-materials", icon: "folder", roles: ["super_admin", "editor"] },
      { label: "Student Applications", href: "/admin/student-applications", icon: "userAdd", roles: ["super_admin", "editor"] },
      { label: "Certificates", href: "/admin/certificates", icon: "medal", roles: ["super_admin", "editor"] },
    ],
  },
  {
    label: "Media",
    icon: "image",
    roles: ["super_admin", "editor"],
    items: [
      { label: "Media Library", href: "/admin/media", icon: "image", roles: ["super_admin", "editor"] },
    ],
  },
  {
    label: "System",
    icon: "settings",
    roles: ["super_admin"],
    items: [
      { label: "Settings", href: "/admin/settings", icon: "settings", roles: ["super_admin"] },
      { label: "Users", href: "/admin/users", icon: "team", roles: ["super_admin"] },
      { label: "Client Users", href: "/admin/users/clients", icon: "team", roles: ["super_admin"] },
    ],
  },
];

/* Sidebar section grouping for the parent items */
const SIDEBAR_SECTIONS: Record<string, string> = {
  Overview: "General",
  CRM: "Manage",
  Content: "Content",
  Support: "Inbox",
  Payments: "Sales",
  Marketing: "Sales",
  Courses: "Learning",
  Media: "Library",
  System: "System",
};

/** Resolve the group + tabs for the current path. */
function useAdminNav(role: UserRole) {
  const pathname = usePathname();

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => i.roles.includes(role)),
      })).filter((g) => g.items.length > 0),
    [role]
  );

  const activeGroup = useMemo(() => {
    // Exact /admin → Overview.
    if (pathname === "/admin") return groups.find((g) => g.label === "Overview") ?? groups[0];
    // Longest-matching group.
    const matches = groups.filter((g) =>
      g.items.some((i) => pathname.startsWith(i.href))
    );
    return (
      matches.sort((a, b) =>
        Math.max(...b.items.map((i) => i.href.length)) -
        Math.max(...a.items.map((i) => i.href.length))
      )[0] ?? groups[0]
    );
  }, [pathname, groups]);

  return { groups, activeGroup };
}

function SidebarContent({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { groups } = useAdminNav(role);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <Logo markClassName="size-8" className="[&>span:last-child]:text-base" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {groups.map((group) => {
          const active = group.items.some(
            (i) =>
              i.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(i.href)
          );
          const first = group.items[0];
          return (
            <Link
              key={group.label}
              href={first.href}
              onClick={onNavigate}
              className={cn(
                "nav-item-3d flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
              )}
            >
              <AppIcon name={group.icon} size={18} />
              <span className="flex-1">{group.label}</span>
              <AppIcon name="arrowRight" size={14} className="opacity-40" />
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

  const { groups, activeGroup } = useAdminNav(user.role);

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

  // Sidebar = parent groups only.
  const items: CollapsibleSidebarItem[] = groups.map((g) => ({
    label: g.label,
    href: g.items[0].href,
    icon: g.icon,
    section: SIDEBAR_SECTIONS[g.label],
    count: g.items.length,
  }));

  const isActive = (href: string) => {
    const g = groups.find((grp) => grp.items[0].href === href);
    if (!g) return false;
    return g.items.some(
      (i) =>
        i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)
    );
  };

  // Body tabs = children of the active group.
  const tabs: SectionTabItem[] = (activeGroup?.items ?? []).map((i) => ({
    label: i.label,
    href: i.href,
    icon: i.icon,
  }));

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop collapsible sidebar (parent groups only) */}
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

          {/* Live Karachi-time digital clock (navbar center) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <DigitalClock />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8" key={pathname}>
          {/* Group tabs — children of the active parent */}
          <AdminSectionTabs
            groupLabel={activeGroup?.label ?? ""}
            groupIcon={activeGroup?.icon ?? "dashboard"}
            items={tabs}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
