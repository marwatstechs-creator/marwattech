"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateApplicationStatus,
  deleteApplication,
} from "@/lib/actions/admin/applications";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate } from "@/lib/utils";

const STATUSES = ["new", "reviewed", "interview", "rejected", "hired"] as const;

export function ApplicationsTable({
  rows,
}: {
  rows: (Record<string, unknown> & { id: string })[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const changeStatus = async (id: string, status: string) => {
    setPending(id);
    const res = await updateApplicationStatus(id, status as (typeof STATUSES)[number]);
    setPending(null);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Application status updated");
    router.refresh();
  };

  const remove = (id: string) => deleteApplication(id);

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Resume</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                No applications yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{String(r.applicant_name)}</p>
                  <p className="text-xs text-muted-foreground">{String(r.email)}</p>
                </TableCell>
                <TableCell>
                  {r.careers ? String((r.careers as { title?: string }).title ?? "—") : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(String(r.created_at))}
                </TableCell>
                <TableCell>
                  {r.resume_url ? (
                    <a
                      href={String(r.resume_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <AppIcon name="file" size={14} />
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Select value={String(r.status)} onValueChange={(v) => changeStatus(r.id, v)} disabled={pending === r.id}>
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="capitalize">{s}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <DeleteButton itemId={r.id} onDelete={remove} label="application" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
