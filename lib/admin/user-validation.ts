/**
 * Pure validation, formatting and policy helpers for the Admin → Users hub.
 *
 * Kept free of Next.js / Supabase imports so it can be unit-tested in
 * isolation (Node test runner / Vitest) without mocking framework internals.
 */

export const ROLES = ["super_admin", "editor", "support", "client", "student"] as const;
export type Role = (typeof ROLES)[number];

/** Roles that may access the staff admin console. */
export const STAFF_ROLES: readonly Role[] = ["super_admin", "editor", "support"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isStaffRole(value: unknown): value is Role {
  return isRole(value) && (STAFF_ROLES as readonly Role[]).includes(value);
}

/**
 * Phone validation. Empty strings are allowed (the column is nullable);
 * otherwise require 7–40 characters of digits, +, (), - and spaces.
 */
export function isValidPhone(phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  const trimmed = phone.trim();
  if (!trimmed) return true;
  if (trimmed.length > 40) return false;
  return /^[+()\-\s\d]{7,40}$/.test(trimmed);
}

/**
 * Avatar URL validation. Empty strings are allowed; otherwise it must be a
 * well-formed http(s) URL within a sane length limit.
 */
export function isValidAvatarUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.length > 500) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Whether a user is currently suspended, given their auth banned_until. */
export function isSuspended(bannedUntil: string | null | undefined): boolean {
  return !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
}

/** Human-readable label for activity-log actions. */
const ACTIVITY_LABELS: Record<string, string> = {
  create_user: "User created",
  profile_update: "Profile updated",
  role_change: "Role changed",
  password_reset: "Password force-reset",
  send_reset_link: "Password reset email sent",
  send_confirmation_link: "Confirmation email resent",
  user_suspend: "Account suspended",
  user_unsuspend: "Account activated",
  delete_user: "Account deleted",
};

export function describeActivity(action: string): string {
  return ACTIVITY_LABELS[action] ?? action.replace(/_/g, " ");
}

/** Rate limiting for admin email actions (reset link / confirmation resend). */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 3;

/** Password strength: at least 8 chars, with letters and numbers. */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    password.length <= 200 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  );
}
