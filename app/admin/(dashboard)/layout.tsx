import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");

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
