"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { meetingBookingSchema, type MeetingBookingInput } from "@/lib/validations";
import { submitMeetingBooking } from "@/lib/actions/forms";
import { trackEvent } from "@/lib/analytics";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── Constants ────────────────────────────────────────────────────────── */

const TIMEZONES = [
  { value: "Asia/Karachi", label: "(GMT+5:00) Islamabad, Karachi" },
  { value: "Asia/Dubai", label: "(GMT+4:00) Dubai" },
  { value: "Asia/Riyadh", label: "(GMT+3:00) Riyadh" },
  { value: "Europe/London", label: "(GMT+0:00) London" },
  { value: "Europe/Berlin", label: "(GMT+1:00) Berlin, Paris" },
  { value: "America/New_York", label: "(GMT-4:00) New York" },
  { value: "America/Los_Angeles", label: "(GMT-7:00) Los Angeles" },
  { value: "Asia/Kolkata", label: "(GMT+5:30) New Delhi" },
];

const COUNTRIES = [
  "International",
  "Pakistan",
  "United Arab Emirates",
  "Saudi Arabia",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "India",
  "Bangladesh",
  "Sri Lanka",
  "Malaysia",
  "Singapore",
  "Turkey",
  "Egypt",
  "Other",
];

const HOW_FOUND = [
  "Google search",
  "Facebook",
  "Instagram",
  "WhatsApp",
  "LinkedIn",
  "YouTube",
  "Friend / referral",
  "Other",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
  "10:00 PM", "10:30 PM", "11:00 PM",
];

/* ── Helpers ──────────────────────────────────────────────────────────── */

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Booking stage card (left rail) ──────────────────────────────────── */

function MeetingCard() {
  return (
    <div className="card-3d flex items-start gap-4 rounded-2xl border bg-card p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <AppIcon name="video" size={24} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">Marwat Tech Team</p>
        <h3 className="font-display text-lg font-semibold text-foreground">
          Free Strategy &amp; Discovery Session
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5">
            <AppIcon name="clock" size={13} /> 30 Minutes
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <AppIcon name="video" size={13} /> Google Meet / WhatsApp
          </Badge>
          <Badge variant="gold" className="gap-1.5">
            <AppIcon name="sparkles" size={13} /> Free
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar ────────────────────────────────────────────────────────── */

function Calendar({
  timezone,
  selected,
  onSelect,
  month,
  setMonth,
}: {
  timezone: string;
  selected: string | null;
  onSelect: (key: string) => void;
  month: Date;
  setMonth: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const canPrev = month.getMonth() > today.getMonth() || month.getFullYear() > today.getFullYear();
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
  const canNext = month < maxMonth;

  const isAvailable = (d: Date) => {
    const dow = d.getDay();
    return d >= today && dow !== 0; // Mon–Sat, not in the past
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="grid size-8 place-items-center rounded-full border transition-colors hover:bg-accent-hover disabled:opacity-30"
          aria-label="Previous month"
        >
          <AppIcon name="arrowLeft" size={15} />
        </button>
        <p className="text-sm font-semibold text-foreground">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="grid size-8 place-items-center rounded-full border transition-colors hover:bg-accent-hover disabled:opacity-30"
          aria-label="Next month"
        >
          <AppIcon name="arrowRight" size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`p-${i}`} />;
          const key = toDateKey(d);
          const available = isAvailable(d);
          const isSel = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!available}
              onClick={() => onSelect(key)}
              className={cn(
                "aspect-square rounded-xl text-sm font-medium transition-all",
                available && !isSel && "hover:bg-accent-hover",
                !available && "cursor-not-allowed text-muted-foreground/30",
                isSel && "btn-3d-gold text-black"
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Timezone: {TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone}
      </p>
    </div>
  );
}

/* ── Main flow ───────────────────────────────────────────────────────── */

export function GetStartedFlow({ initialStep }: { initialStep?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<"home" | "book" | "done">(
    initialStep === "book" || initialStep === "details" ? "book" : "home"
  );
  const [substep, setSubstep] = useState<"date" | "time" | "details">("date");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [month, setMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Scroll to the booking panel when entering the booking stage.
  useEffect(() => {
    if (stage === "book") {
      document.getElementById("get-started-book")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [stage]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MeetingBookingInput>({
    resolver: zodResolver(meetingBookingSchema),
    defaultValues: {
      timezone: "Asia/Karachi",
      company: "",
      how_found: "",
    },
  });

  const onSubmit = async (values: MeetingBookingInput) => {
    const finalDate = values.meeting_date || dateKey;
    const finalTime = values.meeting_time || time;
    if (!finalDate || !finalTime) return;
    setPending(true);
    const res = await submitMeetingBooking({
      ...values,
      timezone,
      meeting_date: finalDate,
      meeting_time: finalTime,
    });
    setPending(false);
    if (res.success) {
      trackEvent("meeting_booking", { date: finalDate, time: finalTime });
      setStage("done");
      reset();
      router.replace("/get-started?step=done");
    } else {
      toast.error(res.error ?? "Something went wrong. Please try again.");
    }
  };

  const goBook = () => {
    setStage("book");
    setSubstep("date");
    router.replace("/get-started?step=book");
  };

  /* ── HOME ─────────────────────────────────────────── */
  if (stage === "home") {
    return (
      <div>
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-muted/40">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--brand)/0.10),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="gold" className="mb-5 uppercase tracking-wide">
                Start here for the best experience
              </Badge>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Start with a call.{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Get matched.
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Tell us what you're building. We plan and scope out your exact
                requirements and match you with the right expert within 24 hours.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button variant="gold" size="lg" onClick={goBook} className="gap-2">
                  Book my matching call <AppIcon name="arrowRight" size={16} />
                </Button>
                <Link href="/contact">
                  <Button variant="outline" size="lg">Chat with us first</Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="shield" size={16} className="text-primary" /> 14-day risk-free trial
                </span>
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="clock" size={16} className="text-primary" /> Free 30-min strategy call
                </span>
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="team" size={16} className="text-primary" /> Trusted by businesses worldwide
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary paths */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "video" as const,
                title: "Book a matching call",
                desc: "A free 30-minute strategy session with a senior expert to scope your project and agree next steps.",
                href: "/get-started?step=book",
                cta: "Book my matching call",
              },
              {
                icon: "layers" as const,
                title: "Explore our services",
                desc: "Browse web development, mobile apps, ecommerce, UI/UX, SEO and AI solutions with clear pricing.",
                href: "/services",
                cta: "Browse services",
              },
              {
                icon: "briefcase" as const,
                title: "Apply for a career",
                desc: "Want to build the platform with us? See open positions and send your application.",
                href: "/careers",
                cta: "Apply as a developer",
              },
            ].map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="card-3d group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <AppIcon name={c.icon} size={24} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {c.cta}
                  <AppIcon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ── CONFIRMATION ─────────────────────────────────── */
  if (stage === "done") {
    return (
      <section className="relative overflow-hidden border-b bg-muted/40">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--brand)/0.10),transparent)]" />
        <div className="relative mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
            <AppIcon name="check" size={40} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your call is booked! 🎉
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {dateKey && (
              <>
                We've reserved{" "}
                <span className="font-semibold text-foreground">{formatDisplayDate(dateKey)}</span> at{" "}
                <span className="font-semibold text-foreground">{time}</span> for your
                free strategy session.
              </>
            )}{" "}
            A senior member of our team will contact you to confirm and walk you
            through next steps — usually within a few hours.
          </p>

          <div className="card-3d mx-auto mt-8 max-w-md rounded-2xl border bg-card p-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What happens next</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <AppIcon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                <span>We review your requirements and match you with the right expert.</span>
              </li>
              <li className="flex items-start gap-3">
                <AppIcon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                <span>We send you a confirmation and a calendar invite by email.</span>
              </li>
              <li className="flex items-start gap-3">
                <AppIcon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                <span>You get a clear plan and a no-obligation quotation.</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/services">
              <Button size="lg">Explore our services</Button>
            </Link>
            <Link href={SITE.whatsapp}>
              <Button variant="outline" size="lg">
                <AppIcon name="whatsapp" size={16} /> Message us on WhatsApp
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ── BOOKING ──────────────────────────────────────── */
  return (
    <div id="get-started-book">
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => { setStage("home"); router.replace("/get-started"); }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon name="arrowLeft" size={15} /> Back
          </button>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            {/* Left: meeting card */}
            <div className="space-y-4">
              <MeetingCard />
              <div className="card-3d rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">What to expect</p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "We review your requirements before the call.",
                    "A senior expert walks you through scope, timeline & budget.",
                    "You get a clear plan and a no-obligation quotation.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <AppIcon name="check" size={16} className="mt-0.5 shrink-0 text-primary" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: booking steps */}
            <div className="card-3d rounded-2xl border bg-card p-6">
              {substep === "date" && (
                <div>
                  <div className="mb-5">
                    <p className="text-sm font-medium text-muted-foreground">Step 1 of 3</p>
                    <h2 className="font-display text-xl font-semibold text-foreground">Pick a Date</h2>
                  </div>
                  <div className="mb-5">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Calendar timezone={timezone} selected={dateKey} onSelect={(k) => { setDateKey(k); setSubstep("time"); }} month={month} setMonth={setMonth} />
                </div>
              )}

              {substep === "time" && (
                <div>
                  <button
                    type="button"
                    onClick={() => setSubstep("date")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <AppIcon name="arrowLeft" size={15} /> Back to date
                  </button>
                  <div className="mt-4 mb-5">
                    <p className="text-sm font-medium text-muted-foreground">Step 2 of 3</p>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Pick a Time{dateKey ? <span className="ml-2 text-sm font-normal text-muted-foreground">— {formatDisplayDate(dateKey)}</span> : null}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {TIME_SLOTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTime(s)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                          time === s
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-accent-hover"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    disabled={!time}
                    onClick={() => setSubstep("details")}
                  >
                    Continue <AppIcon name="arrowRight" size={16} />
                  </Button>
                </div>
              )}

              {substep === "details" && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <button
                    type="button"
                    onClick={() => setSubstep("time")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <AppIcon name="arrowLeft" size={15} /> Back to time
                  </button>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Step 3 of 3</p>
                    <h2 className="font-display text-xl font-semibold text-foreground">Contact &amp; Requirements</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateKey ? formatDisplayDate(dateKey) : ""} at {time}
                    </p>
                  </div>

                  {/* Honeypot */}
                  <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...register("website")} />
                  <input type="hidden" {...register("meeting_date")} value={dateKey ?? ""} />
                  <input type="hidden" {...register("meeting_time")} value={time ?? ""} />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mb-name">Full name *</Label>
                      <Input id="mb-name" placeholder="John Doe" {...register("name")} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mb-email">Email *</Label>
                      <Input id="mb-email" type="email" placeholder="john@company.com" {...register("email")} />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mb-country">Country *</Label>
                      <Controller
                        control={control}
                        name="country"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger id="mb-country"><SelectValue placeholder="Select country" /></SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mb-phone">Your phone number *</Label>
                      <Input id="mb-phone" type="tel" placeholder="+92 300 0000000" {...register("phone")} />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mb-company">Company name</Label>
                    <Input id="mb-company" placeholder="Acme Incorporated" {...register("company")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mb-desc">Brief project description *</Label>
                    <Textarea id="mb-desc" rows={4} placeholder="We're building a customer portal and need a senior developer for six months…" {...register("project_description")} />
                    {errors.project_description && <p className="text-sm text-destructive">{errors.project_description.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mb-stack">Tech stack *</Label>
                    <Input id="mb-stack" placeholder={'What is your tech stack? (If you don\'t know, put "Unsure")'} {...register("tech_stack")} />
                    {errors.tech_stack && <p className="text-sm text-destructive">{errors.tech_stack.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mb-found">How did you find us?</Label>
                    <Controller
                      control={control}
                      name="how_found"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <SelectTrigger id="mb-found"><SelectValue placeholder="Select an option" /></SelectTrigger>
                          <SelectContent>
                            {HOW_FOUND.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
                    {pending ? "Booking…" : "Schedule"} <AppIcon name="calendar" size={16} />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Free &amp; no obligation. We'll send you a confirmation by email.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
