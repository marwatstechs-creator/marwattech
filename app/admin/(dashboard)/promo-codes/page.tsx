import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { UdemySyncButton } from "@/components/admin/udemy-sync-button";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import {
  deletePromoCode,
  togglePromoCode,
} from "@/lib/actions/admin/promo-codes";

export const revalidate = 0;

const TAG_BADGE: Record<string, "default" | "secondary" | "gold" | "outline" | "azure" | "destructive"> = {
  latest: "gold",
  full_paid: "destructive",
  other: "outline",
};
const TAG_LABELS: Record<string, string> = {
  latest: "Latest",
  full_paid: "Full-paid",
  other: "Other",
};

export default async function AdminPromoCodesPage() {
  await guardEditor();

  let rows: {
    id: string;
    title: string;
    store: string;
    code: string;
    tag: string;
    sourceLabel: string;
    expires: string;
    enabled: boolean;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("promo_codes")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    rows = ((data ?? []) as unknown as {
      id: string;
      title: string;
      store: string;
      code: string;
      tag: string;
      source: string;
      expires_at: string | null;
      enabled: boolean;
    }[]).map((c) => ({
      id: c.id,
      title: c.title,
      store: c.store,
      code: c.code,
      tag: c.tag,
      sourceLabel: c.source === "auto_udemy" ? "Auto (Udemy)" : "Manual",
      expires: c.expires_at ? `Exp ${c.expires_at.slice(0, 10)}` : "",
      enabled: c.enabled,
    }));
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="Promo Codes"
        description="Promo codes shown on /free-courses — manual codes and the auto Udemy feed."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <UdemySyncButton />
            <Link href="/admin/promo-codes/new">
              <Button>
                <AppIcon name="plus" size={16} />
                New Promo Code
              </Button>
            </Link>
          </div>
        }
      />

      <AdminTable
        rows={rows}
        columns={[
          { key: "title", header: "Title", type: "title", subKey: "store", sortable: true },
          { key: "code", header: "Code" },
          { key: "tag", header: "Tag", type: "badge", badgeMap: TAG_BADGE, badgeLabels: TAG_LABELS },
          { key: "sourceLabel", header: "Source" },
          { key: "enabled", header: "Enabled", type: "switch", switchAction: togglePromoCode as never, switchLabel: "Promo code" },
        ]}
        searchKeys={["title", "store", "code"]}
        searchPlaceholder="Search promo codes…"
        emptyTitle="No promo codes yet"
        emptyDescription="Add your first promo code or sync the Udemy feed."
        emptyAction={{ label: "New Promo Code", href: "/admin/promo-codes/new" }}
        actions={{
          editBase: "/admin/promo-codes/",
          statusKey: "enabled",
          statusOptions: [],
          onDelete: deletePromoCode as never,
          label: "promo code",
        }}
      />
    </>
  );
}
