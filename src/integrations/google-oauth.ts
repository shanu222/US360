import { appUrl } from "@/lib/env";

export const GMAIL_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.send",
] as const;

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export function googleOAuthClient() {
  const clientId = process.env.GMAIL_GOOGLE_ID || process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.GMAIL_GOOGLE_SECRET || process.env.AUTH_GOOGLE_SECRET;
  return { clientId: clientId?.trim() || "", clientSecret: clientSecret?.trim() || "" };
}

export function gmailOAuthConfigured() {
  const { clientId, clientSecret } = googleOAuthClient();
  return Boolean(clientId && clientSecret);
}

export function gmailRedirectUri() {
  return (process.env.GMAIL_REDIRECT_URI || `${appUrl()}/api/integrations/gmail/callback`).replace(/\/$/, "");
}

export function gmailAuthUrl(state: string) {
  const { clientId } = googleOAuthClient();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: gmailRedirectUri(),
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export type GoogleTokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenSet> {
  const { clientId, clientSecret } = googleOAuthClient();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const json = (await res.json()) as GoogleTokenSet & { error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "GOOGLE_EXCHANGE_FAILED");
  }
  return json;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenSet> {
  const { clientId, clientSecret } = googleOAuthClient();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as GoogleTokenSet & { error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    const err = new Error(json.error || "GOOGLE_REFRESH_FAILED") as Error & { code?: string };
    err.code = json.error === "invalid_grant" ? "revoked" : "refresh_failed";
    throw err;
  }
  return json;
}

export async function revokeGoogleToken(token: string) {
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
  } catch {
    /* disconnect still proceeds */
  }
}

export async function googleUserEmail(accessToken: string) {
  const res = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string; id?: string; verified_email?: boolean };
  const email = json.email?.trim().toLowerCase();
  if (!email) return null;
  return { email, googleSub: json.id ?? null, verified: Boolean(json.verified_email) };
}
