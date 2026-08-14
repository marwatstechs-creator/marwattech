import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RowActions } from "@/components/admin/row-actions";
import { AsyncSwitch } from "@/components/admin/async-switch";
import { UdemySyncButton } from "@/components/admin/udemy-sync-button";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import {
  deletePromoCode,
  togglePromoCode,
} from "@/lib/actions/admin/promo-codes";

export const revalidate = 0;

const TAG_BADGE: Record<string, string> = {
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

  let codes: {
    id: string;
    title: string;
    store: string;
    code: string;
    discount_label: string | null;
    tag: string;
    source: string;
    expires_at: string | null;
    enabled: boolean;
    sort_order: number;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("promo_codes")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    codes = data ?? [];
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  No promo codes yet — add your first one.
                </TableCell>
              </TableRow>
            ) : (
              codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.store}
                      {c.expires_at ? ` · Exp ${c.expires_at.slice(0, 10)}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <code className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                      {c.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TAG_BADGE[c.tag] as "gold" | "destructive" | "outline"}>
                      {TAG_LABELS[c.tag] ?? c.tag}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.source === "auto_udemy" ? "Auto (Udemy)" : "Manual"}
                  </TableCell>
                  <TableCell>
                    <AsyncSwitch
                      itemId={c.id}
                      checked={c.enabled}
                      action={togglePromoCode}
                      label="Promo code"
                    />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      itemId={c.id}
                      editHref={`/admin/promo-codes/${c.id}`}
                      onDelete={deletePromoCode}
                      label="promo code"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
