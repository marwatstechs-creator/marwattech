import { AdminPageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { getAuthProviders, guardClient, hasPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const session = await guardClient();

  const providers = await getAuthProviders();

  return (
    <div>
      <AdminPageHeader
        title="Profile & Settings"
        description="Update your name, profile picture and password."
      />
      <ProfileForm
        user={{
          email: session.user.email,
          full_name: session.profile.full_name,
          avatar_url: session.profile.avatar_url,
        }}
        hasPassword={hasPassword(providers)}
      />
    </div>
  );
}
