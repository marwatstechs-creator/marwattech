"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff, requireSuperAdmin, logActivity } from "@/lib/actions/admin/helpers";
import {
  resolveGoogleConfig,
  buildGoogleLoginUrl,
  verifyGoogleIdToken,
  type GoogleLoginMode,
} from "@/lib/google";
import { signInWithVerifiedEmail } from "@/lib/auth";

async function getOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/* ── Settings (staff) ────────────────────────────────────────────────── */

export async function getGoogleSettings() {
  await requireStaff();
  const cfg = await resolveGoogleConfig();
  let stored: { client_id: string | null; one_tap_enabled: boolean } | null = null;
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("google_settings")
      .select("client_id, one_tap_enabled")
      .eq("id", true)
      .maybeSingle();
    stored = data
      ? { client_id: data.client_id, one_tap_enabled: data.one_tap_enabled }
      : null;
  } catch {
    stored = null;
  }
  return {
    enabled: cfg.enabled,
    oneTapEnabled: cfg.oneTapEnabled,
    hasClientId: Boolean(cfg.clientId),
    hasSecret: cfg.hasSecret,
    source: cfg.source,
    stored,
  };
}

const googleSchema = z.object({
  client_id: z.string().max(300).optional().or(z.literal("")),
  client_secret: z.string().max(300).optional().or(z.literal("")),
  enabled: z.boolean().optional(),
  one_tap_enabled: z.boolean().optional(),
  clearSecret: z.boolean().optional(),
});

export async function saveGoogleSettings(input: z.infer<typeof googleSchema>) {
  const { session, db } = await requireSuperAdmin();
  const parsed = googleSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid Google settings." };

  const patch: {
    client_id?: string | null;
    client_secret?: string | null;
    enabled?: boolean;
    one_tap_enabled?: boolean;
  } = {};
  if (parsed.data.client_id) patch.client_id = parsed.data.client_id.trim();
  if (parsed.data.clearSecret) patch.client_secret = null;
  else if (parsed.data.client_secret) patch.client_secret = parsed.data.client_secret.trim();
  if (typeof parsed.data.enabled === "boolean") patch.enabled = parsed.data.enabled;
  if (typeof parsed.data.one_tap_enabled === "boolean")
    patch.one_tap_enabled = parsed.data.one_tap_enabled;

  const { error } = await db.from("google_settings").upsert(
    { id: true, ...patch },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  await logActivity(db, session, "google_settings_update", "google_settings", "google", {
    has_client_id: Boolean(patch.client_id),
    has_secret: Boolean(patch.client_secret),
    enabled: Boolean(patch.enabled),
    one_tap: Boolean(patch.one_tap_enabled),
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}

/* ── Login flow (public) ─────────────────────────────────────────────── */

/** Build the Google OAuth authorize URL for "Sign in with Google". */
export async function getGoogleLoginUrl(mode: GoogleLoginMode) {
  // Random state bound to the user's session (login-CSRF protection). The mode
  // is prefixed so the callback knows which dashboard to route to — Google
  // rejects query strings in the redirect URI, so mode can't travel in the URI.
  const token =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `go-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const state = `${mode}:${token}`;
  const cookieStore = await cookies();
  cookieStore.set("oauth_state_google", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 600,
  });

  const { url, enabled } = await buildGoogleLoginUrl(mode, await getOrigin(), state);
  if (!enabled) {
    return { ok: false as const, notConfigured: true as const };
  }
  return { ok: true as const, url };
}

/** Public config for login pages — exposes the (public) client id so One Tap can render. */
export async function getGooglePublicConfig() {
  const cfg = await resolveGoogleConfig();
  return {
    enabled: cfg.enabled,
    oneTapEnabled: cfg.oneTapEnabled,
    clientId: cfg.clientId,
  };
}

/** Handle a Google One Tap credential (JWT id_token) → verify → sign in. */
export async function handleGoogleOneTap(
  credential: string,
  mode: GoogleLoginMode = "client"
) {
  const cfg = await resolveGoogleConfig();
  if (!cfg.enabled || !cfg.clientId) {
    return { ok: false as const, error: "Google sign-in isn't configured yet." };
  }
  if (!credential) {
    return { ok: false as const, error: "Google didn't return a credential." };
  }
  try {
    const identity = await verifyGoogleIdToken(credential, cfg.clientId);
    const { target, error } = await signInWithVerifiedEmail({
      email: identity.email,
      name: identity.name,
      picture: identity.picture,
      provider: "google",
    });
    if (error) {
      return { ok: false as const, error: "Could not complete sign-in. Please try again." };
    }
    return { ok: true as const, url: target };
  } catch {
    return { ok: false as const, error: "Google sign-in failed. Please try again." };
  }
}
