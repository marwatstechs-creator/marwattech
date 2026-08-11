import Link from "next/link";

import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { canManageContent, isSuperAdmin } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import { formatDate, initials } from "@/lib/utils";

export const revalidate = 60;

export default async function AdminDashboardPage() {
  const session = await getSessionUser();

  const stats = {
    services: 0,
    posts: 0,
    projects: 0,
    unread: 0,
    clients: 0,
  };
  let recentMessages: {
    id: string;
    name: string;
    email: string;
    subject: string | null;
    created_at: string;
  }[] = [];
  let recentPosts: {
    id: string;
    title: string;
    slug: string;
    status: string;
    published_at: string | null;
  }[] = [];

  try {
    const db = await createClient();
    const [services, posts, projects, contact, support, mockup, msg, postRows] =
      await Promise.all([
        db.from("services").select("id", { count: "exact", head: true }),
        db.from("blog_posts").select("id", { count: "exact", head: true }),
        db.from("portfolio_items").select("id", { count: "exact", head: true }),
        db.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
        db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "new"),
        db.from("mockup_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        db
          .from("contact_messages")
          .select("id, name, email, subject, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        db
          .from("blog_posts")
          .select("id, title, slug, status, published_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    stats.services = services.count ?? 0;
    stats.posts = posts.count ?? 0;
    stats.projects = projects.count ?? 0;
    stats.clients = 0;
    stats.unread =
      (contact.count ?? 0) + (support.count ?? 0) + (mockup.count ?? 0);
    recentMessages = msg.data ?? [];
    recentPosts = postRows.data ?? [];
  } catch {
    // Supabase not configured
  }

  const role = session?.profile.role;
  const editor = role ? canManageContent(role) : false;
  const admin = role ? isSuperAdmin(role) : false;

  return (
    <>
      <AdminPageHeader
        title={`Welcome${session?.profile.full_name ? `, ${session.profile.full_name.split(" ")[0]}` : ""}`}
        description="Here’s what’s happening across your site today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="code" label="Services" value={stats.services} />
        <StatCard icon="file" label="Blog posts" value={stats.posts} />
        <StatCard icon="layers" label="Portfolio items" value={stats.projects} />
        <StatCard
          icon="message"
          label="Unread messages"
          value={stats.unread}
          hint="Contact, support & mockups"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent messages */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent messages</CardTitle>
            <Link href="/admin/messages">
              <Button variant="ghost" size="sm">
                View all
                <AppIcon name="arrowRight" size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMessages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No messages yet.
              </p>
            ) : (
              recentMessages.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/messages?view=contact`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent-hover"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.subject || m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.name} · {m.email}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(m.created_at)}
                  </time>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent posts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent posts</CardTitle>
            <Link href="/admin/blog">
              <Button variant="ghost" size="sm">
                Manage
                <AppIcon name="arrowRight" size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPosts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No blog posts yet.
              </p>
            ) : (
              recentPosts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      /blog/{p.slug}
                    </p>
                  </div>
                  <Badge
                    variant={
                      p.status === "published"
                        ? "default"
                        : p.status === "draft"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      {editor && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink href="/admin/services/new" icon="plus" label="New service" />
          <QuickLink href="/admin/portfolio/new" icon="plus" label="New project" />
          <QuickLink href="/admin/blog/new" icon="plus" label="New blog post" />
          <QuickLink href="/admin/media" icon="upload" label="Upload media" />
        </div>
      )}

      {admin && (
        <p className="mt-8 text-xs text-muted-foreground">
          You have super admin access — use it wisely.
        </p>
      )}
    </>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "plus" | "upload";
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <AppIcon name={icon} size={18} />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
