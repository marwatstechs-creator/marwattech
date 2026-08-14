"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { syncUdemyDealsAction } from "@/lib/actions/admin/promo-codes";

export function UdemySyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const res = await syncUdemyDealsAction();
    setBusy(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Synced ${res.count} Udemy deals`);
    router.refresh();
  };

  return (
    <Button type="button" variant="outline" onClick={run} disabled={busy}>
      <AppIcon name={busy ? "refresh" : "external"} size={16} />
      {busy ? "Syncing…" : "Sync Udemy deals"}
    </Button>
  );
}
