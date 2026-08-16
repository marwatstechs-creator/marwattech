"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff, requireSuperAdmin, logActivity } from "@/lib/actions/admin/helpers";
import {
  resolveGitHubConfig,
  buildGitHubLoginUrl,
  type GitHubLoginMode,
} from "@/lib/github";

async function getOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/* ── Settings (staff) ────────────────────────────────────────────────── */

export async function getGitHubSettings() {
  await requireStaff();
  const cfg = await resolveGitHubConfig();
  let stored: { app_name: string | null; client_id: string | null } | null = null;
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("github_settings")
      .select("app_name, client_id")
      .eq("id", true)
      .maybeSingle();
    stored = data ? { app_name: data.app_name, client_id: data.client_id } : null;
  } catch {
    stored = null;
  }
  return {
    enabled: cfg.enabled,
    hasClientId: Boolean(cfg.clientId),
    hasSecret: cfg.hasSecret,
    source: cfg.source,
    stored,
  };
}

const githubSchema = z.object({
  app_name: z.string().max(120).optional().or(z.literal("")),
  client_id: z.string().max(120).optional().or(z.literal("")),
  client_secret: z.string().max(120).optional().or(z.literal("")),
  enabled: z.boolean().optional(),
  clearSecret: z.boolean().optional(),
});

export async function saveGitHubSettings(input: z.infer<typeof githubSchema>) {
  const { session, db } = await requireSuperAdmin();
  const parsed = githubSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid GitHub settings." };

  const patch: {
    app_name?: string;
    client_id?: string;
    client_secret?: string | null;
    enabled?: boolean;
  } = {};
  if (parsed.data.app_name) patch.app_name = parsed.data.app_name.trim();
  if (parsed.data.client_id) patch.client_id = parsed.data.client_id.trim();
  if (parsed.data.clearSecret) patch.client_secret = null;
  else if (parsed.data.client_secret) patch.client_secret = parsed.data.client_secret.trim();
  if (typeof parsed.data.enabled === "boolean") patch.enabled = parsed.data.enabled;

  const { error } = await db
    .from("github_settings")
    .upsert({ id: true, ...patch }, { onConflict: "id" });
  if (error) return { error: error.message };

  await logActivity(db, session, "github_settings_update", "github_settings", "github", {
    app_name: Boolean(patch.app_name),
    has_client_id: Boolean(patch.client_id),
    enabled: Boolean(patch.enabled),
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}

/* ── Login flow (public) ─────────────────────────────────────────────── */

/** Build the GitHub App authorize URL for "Sign in with GitHub". */
export async function getGitHubLoginUrl(mode: GitHubLoginMode) {
  // Random state bound to the user's session (login-CSRF protection). The mode
  // is prefixed so the callback knows which dashboard to route to — GitHub Apps
  // reject query strings in the redirect URI, so mode can't travel in the URI.
  const token =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `gh-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const state = `${mode}:${token}`;
  const cookieStore = await cookies();
  cookieStore.set("oauth_state_github", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 600,
  });

  const { url, enabled } = await buildGitHubLoginUrl(mode, await getOrigin(), state);
  if (!enabled) return { ok: false as const, notConfigured: true as const };
  return { ok: true as const, url };
}

/** Public config for login pages — exposes the (public) client id. */
export async function getGitHubPublicConfig() {
  const cfg = await resolveGitHubConfig();
  return { enabled: cfg.enabled, clientId: cfg.clientId };
}
