import { AdminPageHeader } from "@/components/admin/page-header";
import { MessagesTable } from "@/components/admin/messages-table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/actions/admin/helpers";

export const revalidate = 0;

export default async function AdminMessagesPage() {
  await requireStaff();

  let contact: (Record<string, unknown> & { id: string })[] = [];
  let support: (Record<string, unknown> & { id: string })[] = [];
  let mockup: (Record<string, unknown> & { id: string })[] = [];

  try {
    const db = await createClient();
    const [c, s, m] = await Promise.all([
      db.from("contact_messages").select("*").order("created_at", { ascending: false }),
      db.from("support_tickets").select("*").order("created_at", { ascending: false }),
      db.from("mockup_requests").select("*").order("created_at", { ascending: false }),
    ]);
    contact = (c.data ?? []) as unknown as (Record<string, unknown> & { id: string })[];
    support = (s.data ?? []) as unknown as (Record<string, unknown> & { id: string })[];
    mockup = (m.data ?? []) as unknown as (Record<string, unknown> & { id: string })[];
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Contact messages, support tickets and mockup requests."
      />
      <Tabs defaultValue="contact">
        <TabsList>
          <TabsTrigger value="contact">Contact ({contact.length})</TabsTrigger>
          <TabsTrigger value="support">Support ({support.length})</TabsTrigger>
          <TabsTrigger value="mockup">Mockups ({mockup.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="contact" className="pt-4">
          <MessagesTable type="contact" rows={contact} />
        </TabsContent>
        <TabsContent value="support" className="pt-4">
          <MessagesTable type="support" rows={support} />
        </TabsContent>
        <TabsContent value="mockup" className="pt-4">
          <MessagesTable type="mockup" rows={mockup} />
        </TabsContent>
      </Tabs>
    </>
  );
}
