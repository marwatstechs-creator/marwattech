"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDate, initials, timeAgo } from "@/lib/utils";
import { TICKET_STATUSES, statusLabel, statusTone } from "@/lib/tickets";
import { uploadTicketAttachments } from "@/lib/actions/client/tickets";
import { replyToTicket, closeOwnTicket } from "@/lib/actions/client/tickets";
import {
  staffReplyToTicket,
  updateTicketStatus,
  closeSupportTicket,
  reopenSupportTicket,
  resolveSupportTicket,
  updateTicketNotes,
} from "@/lib/actions/admin/tickets";

export type TicketMessage = {
  id: string;
  sender_type: string;
  sender_name: string | null;
  sender_email: string | null;
  body: string;
  attachments: string[] | null;
  internal: boolean | null;
  created_at: string;
};

export type TicketRow = {
  id: string;
  subject: string | null;
  issue_type: string;
  priority: string;
  status: string;
  email: string;
  name: string;
  message: string;
  internal_notes: string | null;
  created_at: string;
  updated_at: string | null;
  closed_at: string | null;
};

function attachmentKind(url: string): "image" | "video" | "pdf" | "file" {
  const ext = (url.split("?")[0].split(".").pop() ?? "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "avif"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  return "file";
}

function MediaViewer({
  open,
  onClose,
  url,
  kind,
  name,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  kind: "image" | "video";
  name: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{name}</DialogTitle>
        </DialogHeader>
        <div className="grid place-items-center overflow-hidden rounded-lg bg-black/5 p-2">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={name} className="max-h-[75vh] w-auto max-w-full rounded object-contain" />
          ) : (
            <video src={url} controls autoPlay className="max-h-[75vh] w-auto max-w-full rounded" />
          )}
        </div>
        <DialogFooter>
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            <Button variant="outline" size="sm">
              <AppIcon name="download" size={14} /> Download
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Inline thumbnail / chip for a chat attachment; opens a proper viewer. */
function MediaAttachment({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const kind = attachmentKind(url);
  const name = decodeURIComponent(url.split("/").pop() ?? "attachment");
  const close = () => setOpen(false);

  if (kind === "image") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border bg-black/5"
          aria-label={`Open image ${name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25">
            <AppIcon name="external" size={16} className="text-white opacity-0 transition group-hover:opacity-100" />
          </span>
        </button>
        <MediaViewer open={open} onClose={close} url={url} kind="image" name={name} />
      </>
    );
  }

  if (kind === "video") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border bg-black/5"
          aria-label={`Play video ${name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <video src={url} className="h-full w-full object-cover" preload="metadata" muted playsInline />
          <span className="absolute inset-0 grid place-items-center bg-black/30">
            <span className="grid size-8 place-items-center rounded-full bg-black/50 text-white">
              <AppIcon name="play" size={16} />
            </span>
          </span>
        </button>
        <MediaViewer open={open} onClose={close} url={url} kind="video" name={name} />
      </>
    );
  }

  // PDF / other file → compact chip that opens in a new tab.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-[200px] items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs font-medium hover:underline"
    >
      <AppIcon name={kind === "pdf" ? "file" : "download"} size={14} className="shrink-0" />
      <span className="truncate">{name}</span>
    </a>
  );
}

function MessageBubble({
  msg,
  isLast,
  mode,
}: {
  msg: TicketMessage;
  isLast: boolean;
  mode: "admin" | "client";
}) {
  const isSystem = msg.sender_type === "system";
  const isStaff = msg.sender_type === "staff";
  const isCustomer = msg.sender_type === "customer";
  // Own messages align right in BOTH views so the client looks like the admin
  // (staff replies right on admin, the client's own replies right on client).
  const isMine = (mode === "admin" && isStaff) || (mode === "client" && isCustomer);

  // Centered status text was noisy — drop system messages entirely.
  if (isSystem) return null;

  return (
    <div
      className={cn(
        "flex gap-2.5",
        isMine && "flex-row-reverse"
      )}
    >
      <Avatar className="mt-0.5 size-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-bold",
            isMine ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {initials(msg.sender_name || msg.sender_email || "?")}
        </AvatarFallback>
      </Avatar>
      <div className={cn("max-w-[78%] min-w-0", isMine && "text-right")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isMine
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border bg-card text-foreground",
            msg.internal && "border-dashed border-yellow-500/50 bg-yellow-500/5"
          )}
        >
          {msg.body}
          {(msg.attachments ?? []).length > 0 && (
            <div className={cn("mt-2 flex flex-wrap gap-2", isMine && "justify-end")}>
              {(msg.attachments ?? []).map((url, i) => (
                <MediaAttachment key={i} url={url} />
              ))}
            </div>
          )}
        </div>
        <p className={cn("mt-1 text-[11px] text-muted-foreground", isMine && "text-right")}>
          {msg.sender_name || msg.sender_email || "Unknown"}
          {msg.internal && " · internal"}
          {" · "}
          {isLast ? formatDate(msg.created_at) : timeAgo(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

function ReplyBox({
  ticketId,
  mode,
}: {
  ticketId: string;
  mode: "admin" | "client";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [internal, setInternal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = async () => {
    if (!body.trim() && files.length === 0) {
      toast.error("Write a message first.");
      return;
    }
    startTransition(async () => {
      let attachments: string[] = [];
      if (files.length > 0) {
        const up = await uploadTicketAttachments(files);
        if (!up.ok) {
          toast.error(up.error ?? "Could not upload attachments.");
          return;
        }
        attachments = up.urls ?? [];
      }
      const res =
        mode === "admin"
          ? await staffReplyToTicket({ ticketId, body: body.trim(), attachments, internal })
          : await replyToTicket({ ticketId, body: body.trim(), attachments });
      if (!res.ok) {
        toast.error(res.error ?? "Could not send your message.");
        return;
      }
      toast.success("Message sent.");
      setBody("");
      setFiles([]);
      setInternal(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {mode === "admin" ? "Reply to customer" : "Reply to support"}
        </p>
        <div className="flex items-center gap-2">
          {mode === "admin" && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="size-3.5 accent-[var(--color-primary)]"
              />
              Internal note
            </label>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
          >
            <AppIcon name="link" size={14} />
            Attach
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </div>
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={mode === "admin" ? "Write your reply to the customer…" : "Describe your issue or reply…"}
        rows={4}
        className="resize-y"
      />

      {(files.length > 0 || body) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <AppIcon name="file" size={12} />
              {f.name}
              <button
                type="button"
                onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                className="ml-0.5 text-muted-foreground/60 hover:text-foreground"
                aria-label="Remove attachment"
              >
                <AppIcon name="close" size={12} />
              </button>
            </span>
          ))}
          <span className="ml-auto text-[11px]">
            {files.length}/5 attachments
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {mode === "admin"
            ? "Your reply will be visible to the customer."
            : "Our team will reply as soon as possible."}
        </p>
        <Button type="button" onClick={send} disabled={pending}>
          {pending ? (
            <span className="flex items-center gap-2">
              <AppIcon name="refresh" size={15} className="animate-spin" /> Sending…
            </span>
          ) : (
            <>
              <AppIcon name="mailSend" size={15} /> Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function NotesEditor({ ticketId, initial }: { ticketId: string; initial: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? "");

  const save = () => {
    startTransition(async () => {
      const res = await updateTicketNotes(ticketId, { notes: value });
      if (!res.ok) {
        toast.error(res.error ?? "Could not save notes.");
        return;
      }
      toast.success("Notes saved.");
      setEditing(false);
      router.refresh();
    });
  };

  if (!editing) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <AppIcon name="lock" size={14} /> Internal notes
          <span className="text-[11px] font-normal text-muted-foreground">(staff only)</span>
        </p>
        <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
          {initial || "No internal notes yet."}
        </p>
        <div className="mt-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => { setValue(initial ?? ""); setEditing(true); }}>
            <AppIcon name="pencil" size={13} /> Edit notes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <AppIcon name="lock" size={14} /> Internal notes
        <span className="text-[11px] font-normal text-muted-foreground">(staff only)</span>
      </p>
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} className="resize-y" />
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save notes"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setValue(initial ?? ""); setEditing(false); }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function TicketThread({
  ticket,
  messages,
  mode,
}: {
  ticket: TicketRow;
  messages: TicketMessage[];
  mode: "admin" | "client";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const closed = ticket.status === "closed";
  const resolved = ticket.status === "resolved";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Action failed.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Conversation */}
      <div className="min-w-0">
        <div className="mb-4 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold leading-tight">{ticket.subject ?? "Support ticket"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Ticket #{ticket.id.slice(0, 8)} · Created {formatDate(ticket.created_at)}
                {ticket.updated_at && <> · Updated {formatDate(ticket.updated_at)}</>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusTone(ticket.status)}>{statusLabel(ticket.status)}</Badge>
              <Badge variant="secondary">{ticket.issue_type}</Badge>
              <Badge
                variant={
                  ticket.priority === "urgent" ? "destructive" : ticket.priority === "high" ? "gold" : "outline"
                }
              >
                {ticket.priority}
              </Badge>
            </div>
          </div>
          {mode === "admin" && ticket.email && (
            <p className="mt-2 text-xs text-muted-foreground">
              {ticket.name} ·{" "}
              <a href={`mailto:${ticket.email}`} className="text-primary underline-offset-2 hover:underline">
                {ticket.email}
              </a>
            </p>
          )}
        </div>

        {/* Original message + thread */}
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="space-y-4">
            <MessageBubble
              msg={{
                id: "original",
                sender_type: "customer",
                sender_name: ticket.name,
                sender_email: ticket.email,
                body: ticket.message,
                attachments: [],
                internal: false,
                created_at: ticket.created_at,
              }}
              isLast={messages.length === 0}
              mode={mode}
            />
            {messages.map((m, i) => (
              <MessageBubble key={m.id} msg={m} isLast={i === messages.length - 1} mode={mode} />
            ))}
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                No replies yet — our team will respond shortly.
              </p>
            )}
          </div>
        </div>

        {/* Reply */}
        {!closed ? (
          <div className="mt-4">
            <ReplyBox ticketId={ticket.id} mode={mode} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            This ticket is closed.
            {mode === "admin" ? (
              <button
                type="button"
                onClick={() => run(() => reopenSupportTicket(ticket.id))}
                disabled={pending}
                className="ml-2 font-medium text-primary underline-offset-2 hover:underline"
              >
                Reopen ticket
              </button>
            ) : (
              <> Contact us if you need further help.</>
            )}
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        {mode === "admin" && (
          <>
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm font-semibold">Status</p>
              <select
                value={ticket.status}
                onChange={(e) => run(() => updateTicketStatus(ticket.id, e.target.value))}
                disabled={pending}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid gap-2">
                {!resolved && !closed && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => run(() => resolveSupportTicket(ticket.id))}
                    disabled={pending}
                  >
                    <AppIcon name="check" size={14} /> Mark resolved
                  </Button>
                )}
                {!closed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    onClick={() => run(() => closeSupportTicket(ticket.id))}
                    disabled={pending}
                  >
                    <AppIcon name="close" size={14} /> Close ticket
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => run(() => reopenSupportTicket(ticket.id))}
                    disabled={pending}
                  >
                    <AppIcon name="refresh" size={14} /> Reopen ticket
                  </Button>
                )}
              </div>
            </div>

            <NotesEditor ticketId={ticket.id} initial={ticket.internal_notes} />
          </>
        )}

        {mode === "client" && !closed && (
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-2 text-sm font-semibold">Need to close this?</p>
            <p className="mb-3 text-xs text-muted-foreground">
              You can close this ticket once your issue is resolved.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
              onClick={() => run(() => closeOwnTicket(ticket.id))}
              disabled={pending}
            >
              <AppIcon name="close" size={14} /> Close ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
