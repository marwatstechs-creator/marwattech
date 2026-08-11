"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  updateContactStatus,
  updateContactNotes,
  updateSupportStatus,
  updateSupportNotes,
  updateMockupStatus,
  updateMockupNotes,
  deleteContactMessage,
} from "@/lib/actions/admin/messages";
import { formatDate } from "@/lib/utils";

type MessageType = "contact" | "support" | "mockup";

const STATUS_OPTIONS = ["new", "read", "replied", "archived"];

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function MessageDetailDialog({
  type,
  message,
  open,
  onOpenChange,
}: {
  type: MessageType;
  message: Record<string, unknown> & { id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState(String(message.status ?? "new"));
  const [notes, setNotes] = useState(String(message.internal_notes ?? ""));

  const updateStatus = async () => {
    setPending(true);
    const fn =
      type === "contact"
        ? updateContactStatus
        : type === "support"
          ? updateSupportStatus
          : updateMockupStatus;
    const res = await fn(message.id, status as "new" | "read" | "replied" | "archived");
    setPending(false);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Status updated");
    router.refresh();
  };

  const saveNotes = async () => {
    setPending(true);
    const fn =
      type === "contact"
        ? updateContactNotes
        : type === "support"
          ? updateSupportNotes
          : updateMockupNotes;
    const res = await fn(message.id, { notes });
    setPending(false);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Notes saved");
    router.refresh();
  };

  const remove = async () => {
    if (type !== "contact") return;
    const res = await deleteContactMessage(message.id);
    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Message deleted");
    onOpenChange(false);
    router.refresh();
  };

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
          <DialogTitle>
            {type === "contact"
              ? "Contact message"
              : type === "support"
                ? "Support ticket"
                : "Mockup request"}
          </DialogTitle>
          <DialogDescription>
            Received {formatDate(String(message.created_at))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={String(message.name ?? "")} />
            <Field label="Email" value={String(message.email ?? "")} />
            <Field label="Phone" value={String(message.phone ?? "")} />
            {type === "contact" && <Field label="Service" value={String(message.service ?? "")} />}
            {type === "contact" && <Field label="Subject" value={String(message.subject ?? "")} />}
            {type === "support" && <Field label="Issue type" value={String(message.issue_type ?? "")} />}
            {type === "support" && <Field label="Priority" value={String(message.priority ?? "")} />}
            {type === "mockup" && <Field label="Website type" value={String(message.website_type ?? "")} />}
            {type === "mockup" && <Field label="Budget" value={String(message.budget_range ?? "")} />}
          </div>

          <Field label="Message" value={String(message.message ?? message.description ?? "")} />

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="capitalize">{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={updateStatus} disabled={pending} variant="secondary">
                Apply
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Visible only to staff…"
            />
            <Button onClick={saveNotes} disabled={pending} variant="secondary" className="w-full">
              <AppIcon name="save" size={14} />
              Save notes
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              Status: {String(message.status)}
            </Badge>
            <a href={`mailto:${message.email}`} className="text-sm text-primary underline">
              Reply by email
            </a>
          </div>
        </div>

        <DialogFooter>
          {type === "contact" &&
            (confirmDelete ? (
              <Button
                variant="destructive"
                onClick={() => {
                  remove();
                  setConfirmDelete(false);
                }}
                disabled={pending}
              >
                Confirm delete?
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <AppIcon name="delete" size={14} />
                Delete
              </Button>
            ))}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
