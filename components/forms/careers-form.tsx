"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { applicationSchema, type ApplicationInput } from "@/lib/validations";
import { submitApplication } from "@/lib/actions/forms";
import { trackEvent } from "@/lib/analytics";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CareersForm({ careerId, position }: { careerId: string; position: string }) {
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { career_id: careerId, phone: "", cover_letter: "", resume_url: "" },
  });

  const onSubmit = async (values: ApplicationInput) => {
    setPending(true);
    const res = await submitApplication(values);
    setPending(false);
    if (res.success) {
      trackEvent("form_submit", { form: "job_application", position });
      toast.success("Application submitted!", {
        description: `Thanks for applying for ${position}. We’ll be in touch soon.`,
      });
      reset({ career_id: careerId, phone: "", cover_letter: "", resume_url: "" });
    } else {
      toast.error(res.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <input type="hidden" {...register("career_id")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="applicant_name">Full name *</Label>
          <Input id="applicant_name" placeholder="John Doe" {...register("applicant_name")} />
          {errors.applicant_name && (
            <p className="text-sm text-destructive">{errors.applicant_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="john@company.com" {...register("email")} />
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
          <Label htmlFor="resume_url">Resume / portfolio link</Label>
          <Input
            id="resume_url"
            placeholder="https://… (PDF, Drive or portfolio)"
            {...register("resume_url")}
          />
          {errors.resume_url && (
            <p className="text-sm text-destructive">{errors.resume_url.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover_letter">Cover letter</Label>
        <Textarea
          id="cover_letter"
          rows={5}
          placeholder="Why are you a great fit for this role?"
          {...register("cover_letter")}
        />
        {errors.cover_letter && (
          <p className="text-sm text-destructive">{errors.cover_letter.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Submitting…" : (
          <>
            Submit Application
            <AppIcon name="arrowUpRight" size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
