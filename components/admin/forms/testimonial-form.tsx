"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ImageField } from "@/components/admin/image-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTestimonial,
  updateTestimonial,
  type TestimonialInput,
} from "@/lib/actions/admin/testimonials";

export function TestimonialForm({
  initial,
  isEdit,
}: {
  initial?: Partial<TestimonialInput> & { id?: string };
  isEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    client_name: initial?.client_name ?? "",
    company: initial?.company ?? "",
    role: initial?.role ?? "",
    quote: initial?.quote ?? "",
    rating: initial?.rating ?? 5,
    avatar_url: initial?.avatar_url ?? "",
    featured: initial?.featured ?? false,
    status: initial?.status ?? "published",
    sort_order: initial?.sort_order ?? 0,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const payload: TestimonialInput = {
      ...form,
      company: form.company || "",
      role: form.role || "",
      avatar_url: form.avatar_url || "",
    } as TestimonialInput;

    const res = initial?.id
      ? await updateTestimonial(initial.id, payload)
      : await createTestimonial(payload);

    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Testimonial updated" : "Testimonial created");
    router.push("/admin/testimonials");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">Testimonial</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client name *</Label>
                <Input id="client_name" value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="CEO, Founder…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote">Quote *</Label>
              <Textarea id="quote" rows={5} value={form.quote} onChange={(e) => set("quote", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Publishing</h2>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select value={String(form.rating)} onValueChange={(v) => set("rating", Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={String(r)}>{"★".repeat(r)}{"☆".repeat(5 - r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">Show on the homepage</p>
                </div>
                <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Photo</h2>
              <ImageField label="Avatar" value={form.avatar_url ?? ""} onChange={(v) => set("avatar_url", v)} aspect="1/1" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (
            <>
              <AppIcon name="save" size={16} />
              {isEdit ? "Update Testimonial" : "Create Testimonial"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
