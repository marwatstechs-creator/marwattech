import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { MeetingsTable } from "@/components/admin/meetings-table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/actions/admin/helpers";

export const revalidate = 0;

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

export default async function AdminMeetingsPage() {
  await requireStaff();

  let all: (Record<string, unknown> & { id: string })[] = [];
  try {
    const db = await createClient();
    const { data } = await db
      .from("meeting_bookings")
      .select("*")
      .order("meeting_date", { ascending: true })
      .order("meeting_time", { ascending: true })
      .limit(500);
    all = (data ?? []) as unknown as (Record<string, unknown> & { id: string })[];
  } catch {
    // fallback
  }

  const byStatus = (s: string) => all.filter((r) => String(r.status) === s);

  return (
    <>
      <AdminPageHeader
        title="Meetings"
        description="Strategy & discovery call bookings from the Get Started flow."
        actions={
          <Link href="/get-started" target="_blank">
            <Button variant="outline" size="sm">
              <AppIcon name="external" size={15} />
              View booking page
            </Button>
          </Link>
        }
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({byStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({byStatus("confirmed").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({byStatus("completed").length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({byStatus("cancelled").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <MeetingsTable rows={all} />
        </TabsContent>
        {STATUSES.map((s) => (
          <TabsContent key={s} value={s} className="pt-4">
            <MeetingsTable rows={byStatus(s)} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
