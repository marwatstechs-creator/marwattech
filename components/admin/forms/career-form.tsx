"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SlugField } from "@/components/admin/slug-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCareer,
  updateCareer,
  type CareerInput,
} from "@/lib/actions/admin/careers";

export function CareerForm({
  initial,
  isEdit,
}: {
  initial?: Partial<CareerInput> & { id?: string };
  isEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    department: initial?.department ?? "",
    location: initial?.location ?? "",
    job_type: initial?.job_type ?? "Full-time",
    salary_range: initial?.salary_range ?? "",
    description: initial?.description ?? "",
    requirements: initial?.requirements ?? "",
    status: initial?.status ?? "draft",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const payload: CareerInput = {
      ...form,
      department: form.department || "",
      location: form.location || "",
      salary_range: form.salary_range || "",
      description: form.description || "",
      requirements: form.requirements || "",
    } as CareerInput;

    const res = initial?.id
      ? await updateCareer(initial.id, payload)
      : await createCareer(payload);

    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Job updated" : "Job created");
    router.push("/admin/careers");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Basics</h2>
              <div className="space-y-2">
                <Label htmlFor="title">Job title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (!initial?.id && !form.slug)
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                  }}
                  placeholder="Senior Next.js Developer"
                />
              </div>
              <SlugField id="slug" value={form.slug} onChange={(v) => set("slug", v)} title={form.title} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Remote / Bannu" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Job type</Label>
                  <Select value={form.job_type ?? "Full-time"} onValueChange={(v) => set("job_type", v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary range</Label>
                  <Input id="salary_range" value={form.salary_range ?? ""} onChange={(e) => set("salary_range", e.target.value)} placeholder="$3,000 – $5,000 / month" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Description</h2>
              <RichTextEditor value={form.description ?? ""} onChange={(v) => set("description", v)} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Requirements</h2>
              <RichTextEditor value={form.requirements ?? ""} onChange={(v) => set("requirements", v)} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">Publishing</h2>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (
            <>
              <AppIcon name="save" size={16} />
              {isEdit ? "Update Job" : "Create Job"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
