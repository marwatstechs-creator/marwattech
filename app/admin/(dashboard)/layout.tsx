import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionUser } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

const ADMIN_ROLES: UserRole[] = ["super_admin", "editor", "support"];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  // Not logged in → send to admin login.
  if (!session) redirect("/admin/login");
  // Logged in but not an admin role (e.g. a client) → never show /admin.
  if (!ADMIN_ROLES.includes(session.profile.role)) redirect("/admin/login");

  return (
    <AdminShell
      user={{
        email: session.user.email,
        full_name: session.profile.full_name,
        role: session.profile.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
