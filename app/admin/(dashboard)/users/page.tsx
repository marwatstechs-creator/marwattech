import { AdminPageHeader } from "@/components/admin/page-header";
import { UsersTable } from "@/components/admin/users-table";
import { createClient } from "@/lib/supabase/server";
import { guardSuperAdmin } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await guardSuperAdmin();
  let users: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    created_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, role, created_at");
    const { data: authUsers } = await db.auth.admin.listUsers({ perPage: 1000 });

    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email]));
    users = (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailMap.get(p.id) ?? "",
      role: p.role,
      created_at: p.created_at,
    }));
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Users & Roles"
        description="Manage admin, editor and support team members."
      />
      <UsersTable users={users} currentUserId={session.user.id} />
    </>
  );
}
