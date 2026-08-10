import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(100),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30).optional().or(z.literal("")),
  subject: z.string().max(150).optional().or(z.literal("")),
  service: z.string().max(120).optional().or(z.literal("")),
  message: z.string().min(10, "Message should be at least 10 characters").max(5000),
});

export const supportSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(100),
  email: z.string().email("Enter a valid email address"),
  issue_type: z.string().min(1, "Select an issue type"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  subject: z.string().max(150).optional().or(z.literal("")),
  message: z.string().min(10, "Please describe the issue (min 10 characters)").max(5000),
});

export const mockupSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(100),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30).optional().or(z.literal("")),
  website_type: z.string().min(1, "Select a website type"),
  budget_range: z.string().max(50).optional().or(z.literal("")),
  description: z.string().min(20, "Describe your project (min 20 characters)").max(8000),
});

export const applicationSchema = z.object({
  applicant_name: z.string().min(2, "Please enter your name").max(100),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30).optional().or(z.literal("")),
  cover_letter: z.string().max(8000).optional().or(z.literal("")),
  resume_url: z.string().max(500).optional().or(z.literal("")),
  career_id: z.string().uuid("Invalid job reference"),
});

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type SupportInput = z.infer<typeof supportSchema>;
export type MockupInput = z.infer<typeof mockupSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
