import { redirect } from "next/navigation";

import { ClientShell } from "@/components/admin/client-shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/client/login");
  if (session.profile.role !== "client") redirect("/admin/login");

  return (
    <ClientShell
      user={{
        email: session.user.email,
        full_name: session.profile.full_name,
      }}
    >
      {children}
    </ClientShell>
  );
}
