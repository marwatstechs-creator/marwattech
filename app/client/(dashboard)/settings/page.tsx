import { AdminPageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { BecomeStudentCard } from "@/components/profile/become-student-card";
import { getAuthProviders, getSignInMethod, guardClient, hasPassword } from "@/lib/auth";
import { getStudentApplicationStatus } from "@/lib/actions/client/student";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const session = await guardClient();

  const [providers, signInMethod, studentStatus] = await Promise.all([
    getAuthProviders(),
    getSignInMethod(),
    getStudentApplicationStatus(),
  ]);

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
        signInMethod={signInMethod}
      />
      <div className="mt-6">
        <BecomeStudentCard status={studentStatus} />
      </div>
    </div>
  );
}
