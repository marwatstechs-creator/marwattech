"use client";

import { useState } from "react";

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
import { StatusBadge } from "@/components/admin/status-badge";
import { MessageDetailDialog } from "@/components/admin/message-detail";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string };

export function MessagesTable({
  type,
  rows,
}: {
  type: "contact" | "support" | "mockup";
  rows: Row[];
}) {
  const [selected, setSelected] = useState<Row | null>(null);

  const titleKey = type === "mockup" ? "website_type" : type === "support" ? "issue_type" : "subject";

  return (
    <>
      <div className="card-3d rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Title / Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center text-muted-foreground">
                  No {type} messages yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{String(r.name)}</p>
                    <p className="text-xs text-muted-foreground">{String(r.email)}</p>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {String(r[titleKey] ?? "—")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(String(r.created_at))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={String(r.status)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(r)}
                    >
                      <AppIcon name="eye" size={15} />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <MessageDetailDialog
          type={type}
          message={selected}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </>
  );
}
