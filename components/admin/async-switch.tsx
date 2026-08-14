"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

/**
 * A switch bound to a server action (id, boolean) without passing inline
 * closures across the RSC boundary — the action reference + id are both
 * serializable.
 */
export function AsyncSwitch({
  itemId,
  checked,
  action,
  label = "Toggle",
}: {
  itemId: string;
  checked: boolean;
  action: (id: string, value: boolean) => Promise<{ error?: string } | { ok: boolean }>;
  label?: string;
}) {
  const [value, setValue] = useState(checked);
  const [busy, setBusy] = useState(false);

  const onChange = async (next: boolean) => {
    setBusy(true);
    try {
      const res = await action(itemId, next);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setValue(next);
      toast.success(`${label} ${next ? "enabled" : "disabled"}`);
    } finally {
      setBusy(false);
    }
  };

  return <Switch checked={value} disabled={busy} onCheckedChange={onChange} />;
}
