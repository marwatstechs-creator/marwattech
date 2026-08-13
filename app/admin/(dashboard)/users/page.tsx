import { AdminPageHeader } from "@/components/admin/page-header";
import { UsersTable, type AdminUserRow } from "@/components/admin/users-table";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardSuperAdmin } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await guardSuperAdmin();
  let users: AdminUserRow[] = [];

  try {
    const db = await createClient();
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, avatar_url, phone, role, created_at");

    const adminDb = createAdminClient();
    const { data: authUsers } = await adminDb.auth.admin.listUsers({ perPage: 1000 });

    const authMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u]));
    users = (profiles ?? []).map((p) => {
      const au = authMap.get(p.id);
      return {
        id: p.id,
        full_name: p.full_name,
        email: au?.email ?? "",
        phone: p.phone ?? au?.phone ?? null,
        avatar_url: p.avatar_url,
        role: p.role,
        created_at: p.created_at,
        confirmed_at: au?.confirmed_at ?? null,
        last_sign_in_at: au?.last_sign_in_at ?? null,
        banned_until: au?.banned_until ?? null,
        providers: (au?.app_metadata?.providers as string[] | undefined) ?? [],
      };
    });
  } catch {
    // fallback to empty table
  }

  return (
    <>
      <AdminPageHeader
        title="User Management"
        description="Manage every user — roles, details, passwords, access and more."
      />
      <UsersTable users={users} currentUserId={session.user.id} />
    </>
  );
}
