import { AdminPageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { guardClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const session = await guardClient();

  return (
    <div>
      <AdminPageHeader
        title="Profile & Settings"
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
