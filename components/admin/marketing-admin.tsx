"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  addSubscriber,
  removeSubscriber,
  sendCampaign,
  sendSmtpTest,
  previewMarketingEmail,
} from "@/lib/actions/marketing";
import { formatDate } from "@/lib/utils";

export type SubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  created_at: string;
};
export type CampaignRow = {
  id: string;
  subject: string;
  audience: string;
  status: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
};

type Props = {
  subscribers: SubscriberRow[];
  campaigns: CampaignRow[];
  emailConfigured: boolean;
};

function SubscribersTab({ subscribers }: { subscribers: SubscriberRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");

  const add = async () => {
    if (!email.trim()) return;
    setPending(true);
    const res = await addSubscriber({ email, name });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not add subscriber");
      return;
    }
    toast.success("Subscriber added");
    setOpen(false);
    setEmail(""); setName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="gold"><AppIcon name="plus" size={16} /> Add subscriber</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add subscriber</DialogTitle>
              <DialogDescription>Manually add an email to the newsletter list.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
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
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No subscribers yet. The footer newsletter form adds them automatically.</TableCell></TableRow>
            ) : (
              subscribers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="text-sm">{s.name || "—"}</TableCell>
                  <TableCell className="text-xs">{s.source}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "subscribed" ? "default" : s.status === "unsubscribed" ? "outline" : "secondary"}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => removeSubscriber(s.id)}>Remove</Button>
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

function CampaignsTab({ campaigns, emailConfigured }: { campaigns: CampaignRow[]; emailConfigured: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [audience, setAudience] = React.useState<"subscribers" | "clients" | "custom">("subscribers");
  const [customEmails, setCustomEmails] = React.useState("");
  const [preview, setPreview] = React.useState<string | null>(null);

  const previewHtml = async () => {
    if (!subject.trim() || !bodyHtml.trim()) return;
    const res = await previewMarketingEmail({ subject, bodyHtml });
    setPreview(res.html);
  };

  const send = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    setPending(true);
    const res = await sendCampaign({
      subject,
      bodyHtml,
      audience,
      customEmails: customEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean),
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not send campaign");
      return;
    }
    toast.success(`Campaign sent to ${res.sent} recipient(s)`);
    setOpen(false);
    setSubject(""); setBodyHtml(""); setCustomEmails("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {emailConfigured ? "SMTP is configured and ready." : "Email is not configured yet — add SMTP credentials before sending."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            const res = await sendSmtpTest();
            if (!res.ok) toast.error(res.error || "Test failed");
            else toast.success("Test email sent");
          }}>
            Send test email
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="gold"><AppIcon name="plus" size={16} /> New campaign</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create &amp; send campaign</DialogTitle>
                <DialogDescription>
                  Rendered with the Marwat Tech branded email template (red/gold/azure).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="space-y-2"><Label>Subject *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Our new service is here" /></div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscribers">Newsletter subscribers</SelectItem>
                      <SelectItem value="clients">Clients (portal users)</SelectItem>
                      <SelectItem value="custom">Custom emails</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {audience === "custom" && (
                  <div className="space-y-2"><Label>Custom emails (comma / newline separated)</Label><Textarea rows={3} value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} placeholder="a@x.com, b@y.com" /></div>
                )}
                <div className="space-y-2">
                  <Label>Body (HTML) *</Label>
                  <Textarea rows={8} value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} placeholder={"<p>Hi there,</p><p>Write your message here…</p>"} className="font-mono text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={previewHtml} type="button">Preview template</Button>
                  {preview && (
                    <Button variant="outline" type="button" onClick={() => setPreview(null)}>Hide preview</Button>
                  )}
                </div>
                {preview && (
                  <div className="rounded-lg border">
                    <iframe title="Email preview" sandbox="" className="h-72 w-full rounded-lg" srcDoc={preview} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={send} disabled={pending || !emailConfigured}>
                  {pending ? "Sending…" : "Send campaign"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Sent / Failed</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No campaigns sent yet.</TableCell></TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-[220px] truncate font-medium">{c.subject}</TableCell>
                  <TableCell className="text-sm">{c.audience}</TableCell>
                  <TableCell><Badge variant={c.status === "sent" ? "default" : "outline"}>{c.status}</Badge></TableCell>
                  <TableCell className="text-sm">{c.recipients_count}</TableCell>
                  <TableCell className="text-sm">
                    <span className="text-emerald-600">{c.sent_count}</span> / <span className="text-destructive">{c.failed_count}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.sent_at ? formatDate(c.sent_at) : formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MarketingAdmin({ subscribers, campaigns, emailConfigured }: Props) {
  const active = subscribers.filter((s) => s.status === "subscribed").length;
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatBox label="Subscribers" value={subscribers.length} hint={`${active} active`} />
        <StatBox label="Campaigns sent" value={campaigns.filter((c) => c.status === "sent").length} />
        <StatBox label="Email status" value={emailConfigured ? "Configured" : "Not set"} hint="SMTP / Resend" />
      </div>
      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="subscribers" className="pt-4"><SubscribersTab subscribers={subscribers} /></TabsContent>
        <TabsContent value="campaigns" className="pt-4"><CampaignsTab campaigns={campaigns} emailConfigured={emailConfigured} /></TabsContent>
      </Tabs>
    </>
  );
}

function StatBox({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
