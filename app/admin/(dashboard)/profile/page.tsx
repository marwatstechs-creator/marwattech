import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");

  return (
    <div>
      <AdminPageHeader
        title="My Profile"
        description="Update your name and profile picture."
      />
      <ProfileForm
        user={{
          email: session.user.email,
          full_name: session.profile.full_name,
          avatar_url: session.profile.avatar_url,
        }}
      />
    </div>
  );
}
