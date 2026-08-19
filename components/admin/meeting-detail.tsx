"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateMeetingStatus,
  updateMeetingNotes,
  confirmMeeting,
  deleteMeetingBooking,
} from "@/lib/actions/admin/meetings";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"] as const;

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function MeetingDetailDialog({
  meeting,
  open,
  onOpenChange,
}: {
  meeting: Record<string, unknown> & { id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(String(meeting.status ?? "pending"));
  const [link, setLink] = useState(String(meeting.meeting_link ?? ""));
  const [notes, setNotes] = useState(String(meeting.internal_notes ?? ""));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveStatus = async () => {
    setPending(true);
    const res = await updateMeetingStatus(meeting.id, status as (typeof STATUS_OPTIONS)[number]);
    setPending(false);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Status updated");
    router.refresh();
  };

  const confirmWithLink = async () => {
    setPending(true);
    const res = await confirmMeeting(meeting.id, { meeting_link: link });
    setPending(false);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Meeting confirmed — join link emailed to the attendee");
    router.refresh();
  };

  const saveNotes = async () => {
    setPending(true);
    const res = await updateMeetingNotes(meeting.id, { notes });
    setPending(false);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Notes saved");
    router.refresh();
  };

  const remove = async () => {
    const res = await deleteMeetingBooking(meeting.id);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Meeting booking deleted");
    onOpenChange(false);
    router.refresh();
  };

  const dateLabel = meeting.meeting_date ? String(meeting.meeting_date) : undefined;
  const timeLabel = meeting.meeting_time ? String(meeting.meeting_time) : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setConfirmDelete(false);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Meeting booking</DialogTitle>
          <DialogDescription>
            {String(meeting.name)} · {dateLabel ? `${dateLabel} at ${timeLabel ?? "—"}` : "Date not set"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" value={String(meeting.email)} />
          <Field label="Phone" value={meeting.phone ? String(meeting.phone) : undefined} />
          <Field label="Country" value={meeting.country ? String(meeting.country) : undefined} />
          <Field label="Company" value={meeting.company ? String(meeting.company) : undefined} />
          <Field label="Date" value={dateLabel} />
          <Field label="Time" value={timeLabel} />
          <Field label="Timezone" value={meeting.timezone ? String(meeting.timezone) : undefined} />
          <Field label="Tech stack" value={meeting.tech_stack ? String(meeting.tech_stack) : undefined} />
          <Field label="How they found us" value={meeting.how_found ? String(meeting.how_found) : undefined} />
        </div>

        {meeting.project_description ? (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project</p>
            <p className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{String(meeting.project_description)}</p>
          </div>
        ) : null}

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="m-status">Status</Label>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="m-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={saveStatus} disabled={pending}>
              <AppIcon name="save" size={15} /> Save
            </Button>
          </div>
        </div>

        {/* Join link */}
        <div className="space-y-2">
          <Label htmlFor="m-link">Meeting join link</Label>
          <div className="flex gap-2">
            <Input
              id="m-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.google.com/… or https://wa.me/…"
            />
            <Button variant="gold" onClick={confirmWithLink} disabled={pending || !link.trim()}>
              <AppIcon name="video" size={15} /> Confirm &amp; send link
            </Button>
          </div>
          {meeting.meeting_link ? (
            <p className="text-xs text-muted-foreground">
              Current link: <span className="break-all font-mono">{String(meeting.meeting_link)}</span>
            </p>
          ) : null}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="m-notes">Internal notes</Label>
          <div className="flex gap-2">
            <Textarea id="m-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes for the team…" />
            <Button variant="outline" onClick={saveNotes} disabled={pending} className="h-auto">
              <AppIcon name="save" size={15} /> Save
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground">Booked {formatDate(String(meeting.created_at))}</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
          >
            <AppIcon name="delete" size={15} />
            {confirmDelete ? "Confirm delete?" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
