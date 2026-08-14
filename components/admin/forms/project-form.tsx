"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject, updateProject, type ProjectInput } from "@/lib/actions/admin/projects";

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  on_hold: "On Hold",
};

export function ProjectForm({
  initial,
  clients,
  portalUsers,
  isEdit,
}: {
  initial?: Partial<ProjectInput> & { id?: string; budget?: number | string | null };
  clients: { id: string; company: string }[];
  portalUsers: { id: string; full_name: string | null }[];
  isEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    client_id: initial?.client_id ?? "",
    user_id: initial?.user_id ?? "",
    description: initial?.description ?? "",
    status: (initial?.status ?? "planning") as ProjectInput["status"],
    progress: initial?.progress ?? 0,
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    budget: initial?.budget ?? "",
    currency: initial?.currency ?? "USD",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const payload: ProjectInput = {
      ...form,
      client_id: form.client_id || null,
      user_id: form.user_id || null,
      budget: form.budget === "" ? null : Number(form.budget),
    };
    const res = initial?.id
      ? await updateProject(initial.id, payload)
      : await createProject(payload);
    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Project updated" : "Project created");
    router.push("/admin/projects");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-bold">Project details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Company website redesign" required />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={form.client_id || "none"} onValueChange={(v) => set("client_id", v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Portal login (optional)</Label>
              <Select value={form.user_id || "none"} onValueChange={(v) => set("user_id", v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Link a portal account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {portalUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name ?? "Client"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as ProjectInput["status"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input id="progress" type="number" min={0} max={100} value={form.progress} onChange={(e) => set("progress", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Target end date</Label>
              <Input id="end_date" type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" type="number" min={0} step="0.01" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="USD" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Scope, milestones, notes…" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (
            <>
              <AppIcon name="save" size={16} />
              {isEdit ? "Update Project" : "Create Project"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
