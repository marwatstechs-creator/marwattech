"use server";

import { createClient } from "@/lib/supabase/server";
import {
  contactSchema,
  supportSchema,
  mockupSchema,
  applicationSchema,
  meetingBookingSchema,
  type ContactInput,
  type SupportInput,
  type MockupInput,
  type ApplicationInput,
  type MeetingBookingInput,
} from "@/lib/validations";
import {
  notifyContact,
  notifySupport,
  notifyMockup,
  notifyApplication,
  notifyQuoteReceived,
  notifyMeetingBooking,
  meetingBookingConfirmation,
} from "@/lib/email";

type ActionResult = { success: boolean; error?: string };

async function notifyAddresses(): Promise<string> {
  try {
    const db = await createClient();
    const { data } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "form_notify_email")
      .single();
    return data?.value ?? process.env.FORM_NOTIFY_EMAIL ?? "";
  } catch {
    return process.env.FORM_NOTIFY_EMAIL ?? "";
  }
}

function isEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

export async function submitContact(
  input: ContactInput
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Honeypot: silently drop automated spam submissions.
  if (parsed.data.website) return { success: true };

  const db = await createClient();
  const { error } = await db.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    subject: parsed.data.subject || null,
    service: parsed.data.service || null,
    message: parsed.data.message,
  });
  if (error) return { success: false, error: "Could not save your message. Please try again." };

  if (isEmailConfigured()) {
    try {
      const to = await notifyAddresses();
      if (to) {
        await notifyContact(parsed.data, to);
      }
    } catch {
      // Email failure should not block the submission
    }
    // Branded confirmation to the enquirer (best-effort).
    try {
      await notifyQuoteReceived(parsed.data.email, {
        name: parsed.data.name,
        service: parsed.data.service ?? null,
      });
    } catch {
      // ignore
    }
  }

  return { success: true };
}

export async function submitSupport(
  input: SupportInput
): Promise<ActionResult> {
  const parsed = supportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Honeypot: silently drop automated spam submissions.
  if (parsed.data.website) return { success: true };

  const db = await createClient();
  const { error } = await db.from("support_tickets").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    issue_type: parsed.data.issue_type,
    priority: parsed.data.priority,
    subject: parsed.data.subject || null,
    message: parsed.data.message,
  });
  if (error) return { success: false, error: "Could not submit your request. Please try again." };

  if (isEmailConfigured()) {
    try {
      const to = await notifyAddresses();
      if (to) {
        await notifySupport(parsed.data, to);
      }
    } catch {
      // ignore
    }
  }

  return { success: true };
}

export async function submitMockup(input: MockupInput): Promise<ActionResult> {
  const parsed = mockupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Honeypot: silently drop automated spam submissions.
  if (parsed.data.website) return { success: true };

  const db = await createClient();
  const { error } = await db.from("mockup_requests").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    website_type: parsed.data.website_type,
    budget_range: parsed.data.budget_range || null,
    description: parsed.data.description,
  });
  if (error) return { success: false, error: "Could not save your request. Please try again." };

  if (isEmailConfigured()) {
    try {
      const to = await notifyAddresses();
      if (to) {
        await notifyMockup(parsed.data, to);
      }
    } catch {
      // ignore
    }
    // Branded confirmation to the enquirer (best-effort).
    try {
      await notifyQuoteReceived(parsed.data.email, {
        name: parsed.data.name,
        service: "Free Mockup",
      });
    } catch {
      // ignore
    }
  }

  return { success: true };
}

export async function submitApplication(
  input: ApplicationInput
): Promise<ActionResult> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Honeypot: silently drop automated spam submissions.
  if (parsed.data.website) return { success: true };

  const db = await createClient();
  const { error } = await db.from("applications").insert({
    career_id: parsed.data.career_id,
    applicant_name: parsed.data.applicant_name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    resume_url: parsed.data.resume_url || null,
    cover_letter: parsed.data.cover_letter || null,
  });
  if (error) return { success: false, error: "Could not submit your application. Please try again." };

  if (isEmailConfigured()) {
    try {
      const to = await notifyAddresses();
      const { data: job } = await db
        .from("careers")
        .select("title")
        .eq("id", parsed.data.career_id)
        .single();
      if (to) {
        await notifyApplication(
          {
            ...parsed.data,
            career_title: job?.title ?? "Unknown position",
          },
          to
        );
      }
    } catch {
      // ignore
    }
  }

  return { success: true };
}

export async function submitMeetingBooking(
  input: MeetingBookingInput
): Promise<ActionResult> {
  const parsed = meetingBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Honeypot: silently drop automated spam submissions.
  if (parsed.data.website) return { success: true };

  const db = await createClient();
  const { error } = await db.from("meeting_bookings").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    country: parsed.data.country || null,
    company: parsed.data.company || null,
    project_description: parsed.data.project_description,
    tech_stack: parsed.data.tech_stack || null,
    how_found: parsed.data.how_found || null,
    timezone: parsed.data.timezone,
    meeting_date: parsed.data.meeting_date,
    meeting_time: parsed.data.meeting_time,
  });
  if (error) return { success: false, error: "Could not book your call. Please try again." };

  if (isEmailConfigured()) {
    try {
      const to = await notifyAddresses();
      if (to) {
        await notifyMeetingBooking(
          {
            ...parsed.data,
            timezone: parsed.data.timezone || null,
          },
          to
        );
      }
    } catch {
      // ignore
    }
    // Branded confirmation to the person who booked (best-effort).
    try {
      await meetingBookingConfirmation(parsed.data.email, {
        name: parsed.data.name,
        meeting_date: parsed.data.meeting_date,
        meeting_time: parsed.data.meeting_time,
        timezone: parsed.data.timezone || null,
      });
    } catch {
      // ignore
    }
  }

  return { success: true };
}
