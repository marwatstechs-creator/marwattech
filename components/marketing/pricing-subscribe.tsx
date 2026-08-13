"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { subscribeToPlan } from "@/lib/actions/paypal-features";
import { formatMoney } from "@/lib/payments/config";

export type PlanCardData = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  features: unknown;
  paypal_plan_id: string | null;
};

export function PricingSubscribe({ plans }: { plans: PlanCardData[] }) {
  const [busy, setBusy] = React.useState<string | null>(null);

  const subscribe = async (plan: PlanCardData) => {
    const email = window.prompt("Enter your email to subscribe", "");
    if (!email) return;
    setBusy(plan.id);
    const res = await subscribeToPlan({ planId: plan.id, email });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error || "Could not start subscription");
      return;
    }
    toast.success("Opening PayPal to complete your subscription…");
    if ("approveUrl" in res && res.approveUrl) {
      window.open(res.approveUrl, "_blank");
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((p) => {
        const features = Array.isArray(p.features) ? (p.features as string[]) : [];
        return (
          <div
            key={p.id}
            className="card-3d group relative flex flex-col rounded-3xl border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-primary via-[#f8c640] to-[#2563eb] opacity-0 transition-opacity group-hover:opacity-100"
            />
            <p className="font-display text-lg font-bold">{p.name}</p>
            {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
            <div className="mt-5 flex items-end gap-1">
              <span className="font-display text-4xl font-bold text-primary">
                {formatMoney(p.amount, p.currency)}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">/{p.interval}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <AppIcon name="check" size={16} className="mt-0.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {!p.paypal_plan_id ? (
                <Button variant="outline" className="w-full" disabled>
                  Coming soon
                </Button>
              ) : (
                <Button variant="gold" className="w-full" onClick={() => subscribe(p)} disabled={busy === p.id}>
                  {busy === p.id ? "Starting…" : "Subscribe now"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
