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
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deleteAd, toggleAd } from "@/lib/actions/admin/ads";

export const revalidate = 0;

const FORMAT_LABELS: Record<string, string> = {
  auto: "Responsive / Smart",
  fluid: "In-article",
  rectangle: "Rectangle 336×280",
  horizontal: "Leaderboard 728×90",
  vertical: "Half page 300×600",
};

const PLACEMENT_LABELS: Record<string, string> = {
  in_content: "In content",
  listing: "Listing",
  sticky: "Sticky (bottom)",
  sidebar: "Sidebar (left/right)",
};

export default async function AdminAdsPage() {
  await guardEditor();

  let ads: {
    id: string;
    name: string;
    ad_client: string;
    slot_id: string | null;
    mobile_slot_id: string | null;
    mobile_format: string;
    format: string;
    placement: string;
    enabled: boolean;
    sort_order: number;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("ads")
      .select("*")
      .order("sort_order", { ascending: true });
    ads = data ?? [];
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="AdSense Ads"
        description="Manage Google AdSense ad units shown on blog posts, blog listings and study materials."
        actions={
          <Link href="/admin/ads/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Ad
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  No ad units yet — create your first one. (Set your AdSense Client ID
                  under Settings first.)
                </TableCell>
              </TableRow>
            ) : (
              ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <p className="font-medium">{ad.name}</p>
                    <p className="text-xs text-muted-foreground">{ad.ad_client}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {FORMAT_LABELS[ad.format] ?? ad.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {PLACEMENT_LABELS[ad.placement] ?? ad.placement}
                  </TableCell>
                  <TableCell>
                    <AsyncSwitch
                      itemId={ad.id}
                      checked={ad.enabled}
                      action={toggleAd}
                      label="Ad"
                    />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      itemId={ad.id}
                      editHref={`/admin/ads/${ad.id}`}
                      onDelete={deleteAd}
                      label="ad"
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
