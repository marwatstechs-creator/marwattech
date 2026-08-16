/**
 * Google Sign-In / Google One Tap — server helpers.
 *
 * Reads credentials from the `google_settings` DB row (set in
 * Admin → Settings → Google Sign-In), falling back to env vars when the
 * DB row is empty (NEXT_PUBLIC_GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET /
 * NEXT_PUBLIC_GOOGLE_SIGNIN / NEXT_PUBLIC_GOOGLE_ONE_TAP).
 *
 * Flow (mirrors "Log in with PayPal"):
 *   button → buildGoogleLoginUrl() → Google → /auth/google/callback →
 *   exchangeGoogleCode() → signInWithVerifiedEmail() → dashboard.
 *
 * One Tap:
 *   browser GIS script → credential (JWT id_token) →
 *   verifyGoogleIdToken() → signInWithVerifiedEmail() → dashboard.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export type GoogleLoginMode = "admin" | "client";

export type GoogleConfig = {
  enabled: boolean;
  oneTapEnabled: boolean;
  clientId: string | null;
  hasSecret: boolean;
  secret: string | null;
  source: "db" | "env" | "none";
};

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo";

export async function resolveGoogleConfig(): Promise<GoogleConfig> {
  const db = createAdminClient();
  let row: {
    client_id: string | null;
    client_secret: string | null;
    enabled: boolean;
    one_tap_enabled: boolean;
  } | null = null;
  try {
    const { data } = await db
      .from("google_settings")
      .select("client_id, client_secret, enabled, one_tap_enabled")
      .eq("id", true)
      .maybeSingle();
    row = data ?? null;
  } catch {
    row = null;
  }

  const dbClientId = row?.client_id?.trim() || null;
  const dbSecret = row?.client_secret?.trim() || null;

  // Env fallback for deployments that prefer env config.
  const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
  const envSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || null;
  const envEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "true" || Boolean(envClientId && envSecret);
  const envOneTap = process.env.NEXT_PUBLIC_GOOGLE_ONE_TAP === "true";

  const useDb = Boolean(row) || (!envClientId && !envSecret);
  const clientId = useDb ? dbClientId : envClientId;
  const secret = useDb ? dbSecret : envSecret;
  const enabled = useDb ? Boolean(row?.enabled) : envEnabled;
  const oneTapEnabled = useDb ? Boolean(row?.one_tap_enabled) : envOneTap;

  return {
    enabled: enabled && Boolean(clientId && secret),
    oneTapEnabled: oneTapEnabled && Boolean(clientId),
    clientId,
    hasSecret: Boolean(secret),
    secret,
    source: useDb && row ? "db" : envClientId ? "env" : "none",
  };
}

/** Build the Google OAuth authorize URL (redirect the browser here). */
export async function buildGoogleLoginUrl(
  mode: GoogleLoginMode,
  origin: string,
  state?: string
): Promise<{ url: string; enabled: boolean }> {
  const cfg = await resolveGoogleConfig();
  if (!cfg.enabled || !cfg.clientId) {
    return { url: "", enabled: false };
  }
  // Google rejects query strings in the redirect URI (Error 400
  // redirect_uri_mismatch) — it must match the registered URI exactly, so the
  // mode travels via the `state` param instead (see getGoogleLoginUrl).
  const redirectUri = `${origin}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: state ?? `${mode}-${Date.now()}`,
  });
  return { url: `${GOOGLE_AUTH_BASE}?${params.toString()}`, enabled: true };
}

export type GoogleIdentity = {
  email: string;
  name: string | null;
  picture: string | null;
  verified: boolean;
};

/** Exchange the authorize `code` for the user's identity (email + name). */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleIdentity> {
  const cfg = await resolveGoogleConfig();
  if (!cfg.enabled || !cfg.clientId || !cfg.secret) {
    throw new Error("GOOGLE_NOT_CONFIGURED");
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.secret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
    cache: "no-store",
  });
  const tokenData = (await tokenRes.json()) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenData.id_token) {
    throw new Error(
      `GOOGLE_TOKEN_FAILED ${tokenData.error ?? tokenRes.status} ${tokenData.error_description ?? ""}`
    );
  }
  return verifyGoogleIdToken(tokenData.id_token, cfg.clientId);
}

/**
 * Verify a Google id_token JWT (from the callback or One Tap) server-side.
 * Delegates signature + claim validation to Google's tokeninfo endpoint,
 * then enforces the audience + verified email.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string
): Promise<GoogleIdentity> {
  const res = await fetch(
    `${GOOGLE_TOKENINFO_ENDPOINT}?id_token=${encodeURIComponent(idToken)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("GOOGLE_ID_TOKEN_INVALID");
  const claims = (await res.json()) as {
    aud?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
    sub?: string;
  };
  if (claims.aud !== clientId) throw new Error("GOOGLE_AUD_MISMATCH");
  const verified = claims.email_verified === true || claims.email_verified === "true";
  if (!verified) throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
  const email = (claims.email || "").trim().toLowerCase();
  if (!email) throw new Error("GOOGLE_NO_EMAIL");
  return {
    email,
    name: claims.name ?? null,
    picture: claims.picture ?? null,
    verified,
  };
}
