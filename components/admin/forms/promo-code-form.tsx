"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { UploadUrlField } from "@/components/admin/upload-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPromoCode,
  updatePromoCode,
} from "@/lib/actions/admin/promo-codes";

const TAGS = [
  { value: "latest", label: "Latest promo" },
  { value: "full_paid", label: "Full-paid / 100% off" },
  { value: "other", label: "Other promo" },
] as const;

const TAG_LABELS: Record<string, string> = Object.fromEntries(
  TAGS.map((t) => [t.value, t.label])
);

type PromoCodeFormProps = {
  initial?: {
    id: string;
    title: string;
    store: string;
    code: string;
    discount_label: string | null;
    url: string;
    image_url: string | null;
    category: string | null;
    tag: string;
    expires_at: string | null;
    enabled: boolean;
    sort_order: number;
  };
  isEdit?: boolean;
};

export function PromoCodeForm({ initial, isEdit = false }: PromoCodeFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    store: initial?.store ?? "Udemy",
    code: initial?.code ?? "",
    discount_label: initial?.discount_label ?? "",
    url: initial?.url ?? "",
    image_url: initial?.image_url ?? "",
    category: initial?.category ?? "",
    tag: initial?.tag ?? "other",
    expires_at: initial?.expires_at ? initial.expires_at.slice(0, 10) : "",
    enabled: initial?.enabled ?? true,
    sort_order: initial?.sort_order ?? 0,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const payload = {
      title: form.title,
      store: form.store,
      code: form.code,
      discount_label: form.discount_label,
      url: form.url,
      image_url: form.image_url,
      category: form.category,
      tag: form.tag,
      expires_at: form.expires_at,
      enabled: form.enabled,
      sort_order: Number(form.sort_order) || 0,
    };
    const res = initial
      ? await updatePromoCode(initial.id, payload)
      : await createPromoCode(payload);
    setPending(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(initial ? "Promo code updated" : "Promo code added");
    router.push("/admin/promo-codes");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-bold">Promo code</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Complete SQL Bootcamp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store">Store / brand</Label>
              <Input
                id="store"
                value={form.store}
                onChange={(e) => set("store", e.target.value)}
                placeholder="Udemy, Coursera, Skillshare…"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Promo code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="e.g. MAY2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_label">Discount label</Label>
              <Input
                id="discount_label"
                value={form.discount_label}
                onChange={(e) => set("discount_label", e.target.value)}
                placeholder="e.g. 100% OFF, 40% off, ₹500 off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Link</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://…"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image (URL or upload)</Label>
              <UploadUrlField
                id="image_url"
                value={form.image_url}
                onChange={(v) => set("image_url", v)}
                placeholder="https://…/cover.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Development, Business…"
              />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Select value={form.tag} onValueChange={(v) => set("tag", v)}>
                <SelectTrigger>
                  <SelectValue>{TAG_LABELS[form.tag] ?? form.tag}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TAGS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires (optional)</Label>
              <Input
                id="expires_at"
                type="date"
                value={form.expires_at}
                onChange={(e) => set("expires_at", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Order (0 = first)</Label>
              <Input
                id="sort_order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
              <div>
                <p className="font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">
                  Disabled promo codes are hidden from the public page.
                </p>
              </div>
              <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          <AppIcon name="save" size={16} />
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Promo Code"}
        </Button>
      </div>
    </form>
  );
}
