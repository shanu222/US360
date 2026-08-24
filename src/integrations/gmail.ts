import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { track } from "@/lib/analytics";
import {
  exchangeGoogleCode,
  gmailOAuthConfigured,
  googleUserEmail,
  refreshGoogleAccessToken,
  revokeGoogleToken,
  type GoogleTokenSet,
} from "@/integrations/google-oauth";

export const GMAIL_PROVIDER = "gmail";

export type GmailStatus = {
  configured: boolean;
  connected: boolean;
  expired: boolean;
  email: string | null;
  status: string;
};

type GmailMetadata = {
  email?: string;
  googleSub?: string | null;
  lastError?: string | null;
};

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function encodeSubject(subject: string) {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

export function buildGmailRaw(opts: { from: string; to: string; subject: string; text: string; html?: string }) {
  const from = opts.from.trim();
  const to = opts.to.trim();
  const subject = encodeSubject(opts.subject.replace(/[\r\n]+/g, " ").slice(0, 200));
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
  ];
  if (opts.html) {
    const boundary = `us360_${Date.now().toString(16)}`;
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`, "");
    lines.push(`--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "", opts.text);
    lines.push(`--${boundary}`, "Content-Type: text/html; charset=UTF-8", "", opts.html);
    lines.push(`--${boundary}--`);
  } else {
    lines.push("Content-Type: text/plain; charset=UTF-8", "", opts.text);
  }
  return Buffer.from(lines.join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function audit(userId: string, name: string, metadata?: Record<string, unknown>) {
  await track(name, userId, metadata);
}

export async function gmailStatus(userId: string): Promise<GmailStatus> {
  const configured = gmailOAuthConfigured();
  const account = await db.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider: GMAIL_PROVIDER } },
  });
  const meta = (account?.metadata ?? {}) as GmailMetadata;
  const expired = account?.status === "expired" || account?.status === "revoked";
  return {
    configured,
    connected: Boolean(account?.refreshToken || account?.accessToken) && account?.status === "connected",
    expired,
    email: meta.email ?? null,
    status: account?.status ?? "disconnected",
  };
}

export async function saveGmailAccount(userId: string, tokens: GoogleTokenSet) {
  const profile = await googleUserEmail(tokens.access_token);
  const existing = await db.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider: GMAIL_PROVIDER } },
  });
  const previousRefresh = existing?.refreshToken ? decryptSecret(existing.refreshToken) : null;
  const refresh = tokens.refresh_token || previousRefresh;
  if (!refresh) {
    throw new Error("GOOGLE_NO_REFRESH_TOKEN");
  }
  const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
  const scopes = (tokens.scope ?? "").split(/\s+/).filter(Boolean);
  const metadata: GmailMetadata = {
    email: profile?.email,
    googleSub: profile?.googleSub,
    lastError: null,
  };
  await db.integrationAccount.upsert({
    where: { userId_provider: { userId, provider: GMAIL_PROVIDER } },
    update: {
      accessToken: encryptSecret(tokens.access_token),
      refreshToken: encryptSecret(refresh),
      expiresAt,
      scopes: scopes.length ? scopes : ["gmail.send"],
      metadata,
      status: "connected",
    },
    create: {
      userId,
      provider: GMAIL_PROVIDER,
      accessToken: encryptSecret(tokens.access_token),
      refreshToken: encryptSecret(refresh),
      expiresAt,
      scopes: scopes.length ? scopes : ["gmail.send"],
      metadata,
      status: "connected",
    },
  });
  await audit(userId, "gmail.connect", { email: profile?.email });
  return { email: profile?.email ?? null };
}

export async function connectGmailFromCode(userId: string, code: string) {
  const tokens = await exchangeGoogleCode(code);
  return saveGmailAccount(userId, tokens);
}

async function markGmail(userId: string, status: "expired" | "revoked" | "error", lastError?: string) {
  const account = await db.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider: GMAIL_PROVIDER } },
  });
  if (!account) return;
  const metadata = { ...((account.metadata ?? {}) as GmailMetadata), lastError: lastError ?? null };
  await db.integrationAccount.update({
    where: { id: account.id },
    data: { status, metadata },
  });
  await audit(userId, "gmail.error", { status });
}

async function accessTokenForUser(userId: string): Promise<
  | { ok: true; accessToken: string; from: string }
  | { ok: false; reason: string }
> {
  const account = await db.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider: GMAIL_PROVIDER } },
  });
  if (!account?.refreshToken && !account?.accessToken) {
    return { ok: false, reason: "gmail_not_connected" };
  }
  const meta = (account.metadata ?? {}) as GmailMetadata;
  const from = meta.email;
  if (!from) return { ok: false, reason: "gmail_not_connected" };

  const stillValid =
    account.accessToken &&
    account.expiresAt &&
    account.expiresAt.getTime() > Date.now() + 60_000 &&
    account.status === "connected";
  if (stillValid && account.accessToken) {
    return { ok: true, accessToken: decryptSecret(account.accessToken), from };
  }

  if (!account.refreshToken) {
    await markGmail(userId, "expired", "Missing refresh token");
    return { ok: false, reason: "gmail_expired" };
  }

  try {
    const refreshed = await refreshGoogleAccessToken(decryptSecret(account.refreshToken));
    const expiresAt = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : null;
    await db.integrationAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encryptSecret(refreshed.access_token),
        expiresAt,
        status: "connected",
        metadata: { ...meta, lastError: null },
      },
    });
    return { ok: true, accessToken: refreshed.access_token, from };
  } catch (error) {
    const code = (error as { code?: string }).code;
    await markGmail(userId, code === "revoked" ? "revoked" : "expired", "Token refresh failed");
    return { ok: false, reason: "gmail_expired" };
  }
}

export async function disconnectGmail(userId: string) {
  const account = await db.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider: GMAIL_PROVIDER } },
  });
  if (account?.refreshToken) {
    try {
      await revokeGoogleToken(decryptSecret(account.refreshToken));
    } catch {
      /* still delete */
    }
  } else if (account?.accessToken) {
    try {
      await revokeGoogleToken(decryptSecret(account.accessToken));
    } catch {
      /* still delete */
    }
  }
  await db.integrationAccount.deleteMany({ where: { userId, provider: GMAIL_PROVIDER } });
  await audit(userId, "gmail.disconnect");
}

async function gmailApiSend(accessToken: string, raw: string) {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: { code?: number; status?: string; message?: string };
  };
  if (!res.ok || !json.id) {
    const status = json.error?.status || "";
    const code = json.error?.code;
    if (code === 401 || status === "UNAUTHENTICATED") {
      return { sent: false as const, reason: "gmail_expired", retry: true };
    }
    if (code === 403 || status === "PERMISSION_DENIED") {
      return { sent: false as const, reason: "gmail_permission", retry: false };
    }
    return { sent: false as const, reason: "provider_rejected", retry: false };
  }
  return { sent: true as const, id: json.id };
}

export async function sendGmailForUser(opts: {
  userId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const to = opts.to.trim();
  if (!looksLikeEmail(to)) {
    return { sent: false as const, reason: "invalid_address", from: null as string | null };
  }
  const token = await accessTokenForUser(opts.userId);
  if (!token.ok) {
    return { sent: false as const, reason: token.reason, from: null as string | null };
  }

  const raw = buildGmailRaw({
    from: token.from,
    to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });

  let result = await gmailApiSend(token.accessToken, raw);
  if (!result.sent && result.retry) {
    const again = await accessTokenForUser(opts.userId);
    if (again.ok) result = await gmailApiSend(again.accessToken, raw);
  }
  if (!result.sent) {
    if (result.reason === "gmail_expired" || result.reason === "gmail_permission") {
      await markGmail(opts.userId, result.reason === "gmail_permission" ? "revoked" : "expired", result.reason);
    }
    await audit(opts.userId, "gmail.send_failed", { reason: result.reason });
    return { sent: false as const, reason: result.reason, from: token.from };
  }
  await audit(opts.userId, "gmail.send", { accepted: true });
  return { sent: true as const, from: token.from, id: result.id };
}

export function gmailPublicError(reason?: string | null) {
  switch (reason) {
    case "gmail_not_connected":
      return "Connect Gmail in Settings before US360 can send mail from your account.";
    case "gmail_expired":
      return "Gmail connection expired. Reconnect Gmail to send mail again.";
    case "gmail_permission":
      return "Gmail did not grant send permission. Reconnect Gmail and allow sending.";
    case "invalid_address":
      return "That email address does not look valid.";
    case "provider_rejected":
      return "Gmail did not accept the message. Try again, or reconnect Gmail.";
    default:
      return "The email was not sent.";
  }
}
