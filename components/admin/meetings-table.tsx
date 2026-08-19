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
import { MeetingDetailDialog } from "@/components/admin/meeting-detail";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string };

export function MeetingsTable({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<Row | null>(null);

  return (
    <>
      <div className="card-3d rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Who</TableHead>
              <TableHead>Meeting</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center text-muted-foreground">
                  No meeting bookings yet. They appear here when someone books a call from /get-started.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{String(r.name)}</p>
                    <p className="text-xs text-muted-foreground">{String(r.email)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{String(r.meeting_date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(r.meeting_time)}
                      {r.company ? ` · ${String(r.company)}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(String(r.created_at))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={String(r.status)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>
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
        <MeetingDetailDialog
          meeting={selected}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </>
  );
}
