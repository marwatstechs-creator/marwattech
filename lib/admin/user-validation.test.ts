import { describe, it, expect } from "vitest";

import {
  ROLES,
  STAFF_ROLES,
  isRole,
  isStaffRole,
  isValidPhone,
  isValidAvatarUrl,
  isSuspended,
  describeActivity,
  isStrongPassword,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/admin/user-validation";

describe("roles", () => {
  it("validates known roles", () => {
    for (const r of ROLES) expect(isRole(r)).toBe(true);
    expect(isRole("hacker")).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole(123)).toBe(false);
  });

  it("distinguishes staff roles from client/student", () => {
    for (const r of STAFF_ROLES) expect(isStaffRole(r)).toBe(true);
    expect(isStaffRole("client")).toBe(false);
    expect(isStaffRole("student")).toBe(false);
  });

  it("defines all five roles", () => {
    expect(ROLES).toEqual(["super_admin", "editor", "support", "client", "student"]);
  });
});

describe("phone validation", () => {
  it("allows empty (nullable column)", () => {
    expect(isValidPhone("")).toBe(true);
    expect(isValidPhone("   ")).toBe(true);
  });

  it("accepts international numbers", () => {
    expect(isValidPhone("+92 300 1234567")).toBe(true);
    expect(isValidPhone("+1 (415) 555-2671")).toBe(true);
    expect(isValidPhone("03001234567")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("123")).toBe(false); // too short
    expect(isValidPhone("a".repeat(41))).toBe(false);
    expect(isValidPhone(12345)).toBe(false);
  });
});

describe("avatar URL validation", () => {
  it("allows empty (nullable column)", () => {
    expect(isValidAvatarUrl("")).toBe(true);
  });

  it("accepts http(s) URLs", () => {
    expect(isValidAvatarUrl("https://supabase-api.marwattech.com/media/avatar.png")).toBe(true);
    expect(isValidAvatarUrl("http://example.com/a.jpg")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidAvatarUrl("javascript:alert(1)")).toBe(false);
    expect(isValidAvatarUrl("ftp://example.com/a.png")).toBe(false);
    expect(isValidAvatarUrl("not-a-url")).toBe(false);
    expect(isValidAvatarUrl("https://" + "a".repeat(600))).toBe(false);
  });
});

describe("suspension", () => {
  it("treats a future banned_until as suspended", () => {
    const future = new Date(Date.now() + 100000).toISOString();
    expect(isSuspended(future)).toBe(true);
  });

  it("treats null/past/undefined as not suspended", () => {
    expect(isSuspended(null)).toBe(false);
    expect(isSuspended(undefined)).toBe(false);
    const past = new Date(Date.now() - 100000).toISOString();
    expect(isSuspended(past)).toBe(false);
  });
});

describe("activity descriptions", () => {
  it("maps known actions to readable labels", () => {
    expect(describeActivity("role_change")).toBe("Role changed");
    expect(describeActivity("user_suspend")).toBe("Account suspended");
    expect(describeActivity("send_reset_link")).toBe("Password reset email sent");
    expect(describeActivity("delete_user")).toBe("Account deleted");
  });

  it("falls back to a humanized action", () => {
    expect(describeActivity("some_custom_event")).toBe("some custom event");
  });
});

describe("password strength", () => {
  it("accepts strong passwords", () => {
    expect(isStrongPassword("CorrectHorse42")).toBe(true);
    expect(isStrongPassword("abcdefg1")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(isStrongPassword("short1")).toBe(false); // < 8 chars
    expect(isStrongPassword("alllettersonly")).toBe(false); // no number
    expect(isStrongPassword("123456789")).toBe(false); // no letter
  });
});

describe("rate-limit policy", () => {
  it("has a sane window and max", () => {
    expect(RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
    expect(RATE_LIMIT_MAX).toBeGreaterThan(0);
  });
});
