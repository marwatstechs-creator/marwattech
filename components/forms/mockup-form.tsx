"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { mockupSchema, type MockupInput } from "@/lib/validations";
import { submitMockup } from "@/lib/actions/forms";
import { trackEvent } from "@/lib/analytics";
import { MOCKUP_WEBSITE_TYPES, MOCKUP_BUDGETS } from "@/lib/constants";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MockupForm() {
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MockupInput>({
    resolver: zodResolver(mockupSchema),
    defaultValues: { phone: "", budget_range: "" },
  });

  const onSubmit = async (values: MockupInput) => {
    setPending(true);
    const res = await submitMockup(values);
    setPending(false);
    if (res.success) {
      trackEvent("form_submit", { form: "free_mockup" });
      toast.success("Request received!", {
        description: "We’ll send your free mockup concept within 2–3 business days.",
      });
      reset();
    } else {
      toast.error(res.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name *</Label>
          <Input id="name" placeholder="John Doe" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@company.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+92 300 0000000" {...register("phone")} />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Website type *</Label>
          <Controller
            control={control}
            name="website_type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select website type" />
                </SelectTrigger>
                <SelectContent>
                  {MOCKUP_WEBSITE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.website_type && (
            <p className="text-sm text-destructive">
              {errors.website_type.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Budget range (optional)</Label>
        <Controller
          control={control}
          name="budget_range"
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a budget range" />
              </SelectTrigger>
              <SelectContent>
                {MOCKUP_BUDGETS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Project description *</Label>
        <Textarea
          id="description"
          rows={6}
          placeholder="What is your business? What should the homepage achieve? Any examples you like?"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" variant="gold" className="w-full" disabled={pending}>
        {pending ? "Submitting…" : (
          <>
            Request My Free Mockup
            <AppIcon name="sparkles" size={16} />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No obligation — a concept design for your homepage, completely free.
      </p>
    </form>
  );
}
