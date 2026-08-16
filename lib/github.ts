/**
 * GitHub App login — server helpers.
 *
 * Reads credentials from the `github_settings` DB row (set in Admin →
 * Settings → GitHub Sign-In), falling back to env vars when the DB row is
 * empty (NEXT_PUBLIC_GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).
 *
 * Flow (mirrors Google):
 *   button → buildGitHubLoginUrl() → GitHub authorize →
 *   /auth/github/callback → exchangeGitHubCode() →
 *   signInWithVerifiedEmail() → dashboard.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export type GitHubLoginMode = "admin" | "client";

export type GitHubConfig = {
  enabled: boolean;
  clientId: string | null;
  hasSecret: boolean;
  secret: string | null;
  source: "db" | "env" | "none";
};

const GITHUB_AUTH_BASE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";

export async function resolveGitHubConfig(): Promise<GitHubConfig> {
  const db = createAdminClient();
  let row: {
    client_id: string | null;
    client_secret: string | null;
    enabled: boolean;
  } | null = null;
  try {
    const { data } = await db
      .from("github_settings")
      .select("client_id, client_secret, enabled")
      .eq("id", true)
      .maybeSingle();
    row = data ?? null;
  } catch {
    row = null;
  }

  const dbClientId = row?.client_id?.trim() || null;
  const dbSecret = row?.client_secret?.trim() || null;

  const envClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID?.trim() || null;
  const envSecret = process.env.GITHUB_CLIENT_SECRET?.trim() || null;
  const envEnabled = Boolean(envClientId && envSecret);

  const useDb = Boolean(row) || (!envClientId && !envSecret);
  const clientId = useDb ? dbClientId : envClientId;
  const secret = useDb ? dbSecret : envSecret;
  const enabled = useDb ? Boolean(row?.enabled) : envEnabled;

  return {
    enabled: enabled && Boolean(clientId && secret),
    clientId,
    hasSecret: Boolean(secret),
    secret,
    source: useDb && row ? "db" : envClientId ? "env" : "none",
  };
}

/** Build the GitHub App authorize URL (redirect the browser here). */
export async function buildGitHubLoginUrl(
  mode: GitHubLoginMode,
  origin: string,
  state?: string
): Promise<{ url: string; enabled: boolean }> {
  const cfg = await resolveGitHubConfig();
  if (!cfg.enabled || !cfg.clientId) {
    return { url: "", enabled: false };
  }
  // GitHub Apps require the redirect URI to match the registered value exactly
  // (no query string), so the mode travels via the `state` param instead (see
  // getGitHubLoginUrl).
  const redirectUri = `${origin}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state: state ?? `${mode}-${Date.now()}`,
  });
  return { url: `${GITHUB_AUTH_BASE}?${params.toString()}`, enabled: true };
}

export type GitHubIdentity = {
  email: string;
  name: string | null;
  picture: string | null;
  login: string | null;
};

/**
 * Exchange the authorize `code` for the user's GitHub identity (email + name
 * + avatar). Fetches the primary verified email from /user/emails when the
 * /user endpoint hides it.
 */
export async function exchangeGitHubCode(
  code: string,
  redirectUri: string
): Promise<GitHubIdentity> {
  const cfg = await resolveGitHubConfig();
  if (!cfg.enabled || !cfg.clientId || !cfg.secret) {
    throw new Error("GITHUB_NOT_CONFIGURED");
  }

  const tokenRes = await fetch(GITHUB_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.secret,
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      `GITHUB_TOKEN_FAILED ${tokenData.error ?? tokenRes.status} ${tokenData.error_description ?? ""}`
    );
  }
  const accessToken = tokenData.access_token;

  const userRes = await fetch(`${GITHUB_API}/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  const user = (await userRes.json()) as {
    login?: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
  if (!userRes.ok || !user.login) throw new Error("GITHUB_USER_FAILED");

  let email = (user.email || "").trim();
  if (!email) {
    const emailsRes = await fetch(`${GITHUB_API}/user/emails`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as {
        email: string;
        primary?: boolean;
        verified?: boolean;
      }[];
      const primary = emails.find((e) => e.primary && e.verified) ?? emails[0];
      if (primary?.email) email = primary.email.trim();
    }
  }
  if (!email) throw new Error("GITHUB_NO_EMAIL");

  return {
    email: email.toLowerCase(),
    name: user.name ?? user.login ?? null,
    picture: user.avatar_url ?? null,
    login: user.login ?? null,
  };
}
