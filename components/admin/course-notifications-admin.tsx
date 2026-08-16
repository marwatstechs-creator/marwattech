"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  addCourseSubscriber,
  setCourseSubscriberStatus,
  deleteCourseSubscriber,
  saveCourseNotificationConfig,
  sendCourseDigestNow,
  sendSubscriberBroadcast,
} from "@/lib/actions/admin/course-notifications";

export type CourseSubscriberRow = {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
};

export type CourseUpdateEventRow = {
  id: string;
  course_id: string;
  course_title?: string | null;
  event_type: string;
  summary: string | null;
  meaningful: boolean;
  included_in_digest: boolean;
  created_at: string;
};

export type CourseDigestSendRow = {
  id: string;
  email: string;
  courses: string[];
  status: string;
  error: string | null;
  sent_at: string;
};

export type CourseNotifConfig = {
  enabled: boolean;
  mode: "digest" | "immediate";
  time: string;
};

type Props = {
  subscribers: CourseSubscriberRow[];
  events: CourseUpdateEventRow[];
  digestSends: CourseDigestSendRow[];
  config: CourseNotifConfig;
  emailConfigured: boolean;
  stats: { active: number; total: number; pending: number };
};

const EVENT_LABELS: Record<string, string> = {
  course_created: "New course",
  course_published: "Published",
  title_updated: "Title updated",
  description_updated: "Description updated",
  lesson_added: "Lesson added",
  lesson_updated: "Lesson updated",
  minor_change: "Minor change",
};

function SubscribersTab({
  subscribers,
}: {
  subscribers: CourseSubscriberRow[];
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const filtered = subscribers.filter((s) => s.email.toLowerCase().includes(q.toLowerCase()));

  const add = async () => {
    if (!email.trim()) return;
    setPending(true);
    const res = await addCourseSubscriber({ email });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not add subscriber");
      return;
    }
    toast.success("Subscriber added");
    setOpen(false);
    setEmail("");
  };

  const setStatus = async (id: string, status: "subscribed" | "unsubscribed") => {
    const res = await setCourseSubscriberStatus(id, status);
    if (!res.ok) toast.error(res.error || "Update failed");
    else toast.success(status === "subscribed" ? "Subscribed" : "Unsubscribed");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <AppIcon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email…"
            className="pl-9"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gold"><AppIcon name="plus" size={16} /> Add subscriber</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add course-update subscriber</DialogTitle>
              <DialogDescription>
                Manually subscribe an email to course-update notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={add} disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Sr No</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead>Unsubscribed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No subscribers found.</TableCell></TableRow>
            ) : (
              filtered.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="w-12 text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "subscribed" ? "default" : "outline"}>
                      {s.status === "subscribed" ? "Subscribed" : "Unsubscribed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(s.subscribed_at)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.unsubscribed_at ? formatDate(s.unsubscribed_at) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {s.status === "subscribed" ? (
                        <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "unsubscribed")}>Unsubscribe</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "subscribed")}>Resubscribe</Button>
                      )}
                      <DeleteButton itemId={s.id} onDelete={(id) => deleteCourseSubscriber(id)} label="subscriber" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ConfigTab({
  config,
  emailConfigured,
  stats,
}: {
  config: CourseNotifConfig;
  emailConfigured: boolean;
  stats: Props["stats"];
}) {
  const [enabled, setEnabled] = React.useState(config.enabled);
  const [mode, setMode] = React.useState<"digest" | "immediate">(config.mode);
  const [time, setTime] = React.useState(config.time);
  const [pending, setPending] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const save = async () => {
    setPending(true);
    const res = await saveCourseNotificationConfig({ enabled, mode, time });
    setPending(false);
    if (!res.ok) toast.error(res.error || "Could not save");
    else toast.success("Notification settings saved");
  };

  const sendNow = async () => {
    setSending(true);
    const res = await sendCourseDigestNow();
    setSending(false);
    if (!res.ok) toast.error(res.error || "Digest failed");
    else if (res.sent && res.sent > 0) toast.success(`Digest sent to ${res.sent} subscriber(s)`);
    else toast.info(res.reason === "no-events" ? "No pending course updates to send." : `Nothing to send (${res.reason}).`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5 rounded-xl border bg-card p-6">
        <h3 className="font-display text-base font-bold">Settings</h3>

        {!emailConfigured && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AppIcon name="alertCircle" size={16} className="mt-0.5 shrink-0" />
            <span>Email isn&apos;t configured yet. Add SMTP/Resend credentials in Admin → Settings → Email to enable sending.</span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-semibold">Automatic course-update emails</p>
            <p className="text-xs text-muted-foreground">Master switch for course-update notifications.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Delivery mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "digest" | "immediate")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="digest">Daily digest (recommended)</SelectItem>
                <SelectItem value="immediate">Immediately on update</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Digest delivery time (24h)</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
          <Button variant="outline" onClick={sendNow} disabled={sending}>
            <AppIcon name="refresh" size={15} className="mr-1.5" />
            {sending ? "Sending…" : "Send digest now"}
          </Button>
          <BroadcastDialog emailConfigured={emailConfigured} subscriberCount={stats.active} />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-display text-base font-bold">Statistics</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="font-display text-2xl font-bold text-primary">{stats.active}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active subscribers</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="font-display text-2xl font-bold">{stats.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="font-display text-2xl font-bold text-gold-foreground">{stats.pending}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pending updates</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Pending updates are meaningful course/lesson changes not yet included in a digest. They are
          sent together in the next daily evening digest (or via &quot;Send digest now&quot;).
        </p>
      </div>
    </div>
  );
}

/** Manual broadcast — send a custom branded email to all active subscribers. */
function BroadcastDialog({
  emailConfigured,
  subscriberCount,
}: {
  emailConfigured: boolean;
  subscriberCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setSending(true);
    const res = await sendSubscriberBroadcast({ subject, body });
    setSending(false);
    if (!res.ok) {
      toast.error(res.error || "Broadcast failed");
      return;
    }
    toast.success(
      res.sent && res.sent > 0
        ? `Email sent to ${res.sent} subscriber(s)`
        : "No emails sent"
    );
    if (res.error) toast.warning(res.error);
    setOpen(false);
    setSubject("");
    setBody("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <AppIcon name="mailSend" size={15} className="mr-1.5" />
          Email all subscribers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Email all course subscribers</DialogTitle>
          <DialogDescription>
            Send a branded email to {subscriberCount} active subscriber(s). Each recipient
            gets their own unsubscribe link. Emails are sent in batches of 50 per run to stay
            within server limits — click again to continue for larger lists.
          </DialogDescription>
        </DialogHeader>
        {!emailConfigured && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AppIcon name="alertCircle" size={16} className="mt-0.5 shrink-0" />
            <span>Email isn&apos;t configured yet. Add SMTP/Resend credentials in Admin → Settings → Email.</span>
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Big news from Marwat Tech…" maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              placeholder={"Write your message here…\n\nPlain text is fine — it's sent in our branded email layout."}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={send} disabled={sending || !emailConfigured}>
            <AppIcon name="mailSend" size={15} className="mr-1.5" />
            {sending ? "Sending…" : `Send to ${subscriberCount} subscribers`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryTab({
  events,
  digestSends,
}: {
  events: CourseUpdateEventRow[];
  digestSends: CourseDigestSendRow[];
}) {
  const [showAll, setShowAll] = React.useState(false);
  const sentCount = digestSends.filter((d) => d.status === "sent").length;
  const failedCount = digestSends.filter((d) => d.status === "failed").length;
  const visible = showAll ? digestSends : digestSends.slice(0, 100);

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold">Email send log</h3>
            <p className="text-xs text-muted-foreground">
              Complete record of every email sent to subscribers — with time stamps.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Total: {digestSends.length}</Badge>
            <Badge variant="secondary">Sent: {sentCount}</Badge>
            {failedCount > 0 && <Badge variant="destructive">Failed: {failedCount}</Badge>}
          </div>
        </div>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Sr No</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Sent (UTC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {digestSends.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No emails sent yet.</TableCell></TableRow>
              ) : (
                visible.map((d, i) => (
                  <TableRow key={d.id}>
                    <TableCell className="w-12 text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{d.email}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{d.courses.join(", ") || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={d.status === "sent" ? "default" : d.status === "failed" ? "destructive" : "outline"}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-destructive" title={d.error ?? undefined}>
                      {d.error ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground" title={formatDateTime(d.sent_at)}>
                      {formatDateTime(d.sent_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {digestSends.length > 100 && (
          <div className="mt-3 text-center">
            <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show less" : `Show all ${digestSends.length} records`}
            </Button>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display mb-2 text-base font-bold">Course update events (what triggers notifications)</h3>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Sr No</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created (UTC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No course update events yet.</TableCell></TableRow>
              ) : (
                events.slice(0, 50).map((e, i) => (
                  <TableRow key={e.id}>
                    <TableCell className="w-12 text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="max-w-[180px] truncate font-medium">{e.course_title || "—"}</TableCell>
                    <TableCell>{EVENT_LABELS[e.event_type] ?? e.event_type}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">{e.summary || "—"}</TableCell>
                    <TableCell>
                      {e.included_in_digest ? (
                        <Badge variant="outline">Sent</Badge>
                      ) : e.meaningful ? (
                        <Badge>Pending</Badge>
                      ) : (
                        <Badge variant="secondary">Minor</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground" title={formatDateTime(e.created_at)}>
                      {formatDateTime(e.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export function CourseNotificationsAdmin(props: Props) {
  return (
    <Tabs defaultValue="subscribers">
      <TabsList>
        <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        <TabsTrigger value="config">Config &amp; Stats</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="subscribers"><SubscribersTab subscribers={props.subscribers} /></TabsContent>
      <TabsContent value="config">
        <ConfigTab config={props.config} emailConfigured={props.emailConfigured} stats={props.stats} />
      </TabsContent>
      <TabsContent value="history"><HistoryTab events={props.events} digestSends={props.digestSends} /></TabsContent>
    </Tabs>
  );
}
