"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowActionsProps = {
  itemId: string;
  editHref: string;
  onDelete?: (id: string) => Promise<{ error?: string } | { ok: boolean }>;
  status?: string;
  onStatusChange?: (
    id: string,
    status: string
  ) => Promise<{ error?: string } | { ok: boolean }>;
  statusOptions?: string[];
  viewHref?: string;
  label?: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  new: "New",
  read: "Read",
  replied: "Replied",
  reviewed: "Reviewed",
  interview: "Interview",
  rejected: "Rejected",
  hired: "Hired",
};

export function RowActions({
  itemId,
  editHref,
  onDelete,
  status,
  onStatusChange,
  statusOptions,
  viewHref,
  label = "item",
}: RowActionsProps) {
  const router = useRouter();

  const changeStatus = async (next: string) => {
    if (!onStatusChange) return;
    const res = await onStatusChange(itemId, next);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Status changed to ${STATUS_LABELS[next] ?? next}`);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {status && <StatusBadge status={status} />}
      {statusOptions && onStatusChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Change status">
              <AppIcon name="settings" size={15} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Set status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((s) => (
              <DropdownMenuItem key={s} onClick={() => changeStatus(s)}>
                {STATUS_LABELS[s] ?? s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Link href={editHref}>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Edit">
          <AppIcon name="edit" size={15} />
        </Button>
      </Link>
      {viewHref && (
        <Link href={viewHref} target="_blank">
          <Button variant="ghost" size="icon" className="size-8" aria-label="View">
            <AppIcon name="eye" size={15} />
          </Button>
        </Link>
      )}
      {onDelete && <DeleteButton itemId={itemId} onDelete={onDelete} label={label} />}
    </div>
  );
}
