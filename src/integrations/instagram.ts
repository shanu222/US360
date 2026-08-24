import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { appUrl } from "@/lib/env";

const AUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth";
const TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";

export function instagramConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function instagramAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URI ?? `${appUrl()}/api/integrations/instagram/callback`,
    state,
    response_type: "code",
    scope: process.env.INSTAGRAM_SCOPES ?? "instagram_basic",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string) {
  const url = new URL(TOKEN_URL);
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set(
    "redirect_uri",
    process.env.META_REDIRECT_URI ?? `${appUrl()}/api/integrations/instagram/callback`,
  );
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("INSTAGRAM_EXCHANGE_FAILED");
  }
  return (await res.json()) as {
    access_token: string;
    token_type?: string;
    expires_in?: number;
  };
}

export async function saveInstagramAccount(userId: string, token: { access_token: string; expires_in?: number }) {
  const encrypted = encryptSecret(token.access_token);
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null;
  return db.integrationAccount.upsert({
    where: { userId_provider: { userId, provider: "instagram" } },
    update: {
      accessToken: encrypted,
      expiresAt,
      status: "connected",
      scopes: (process.env.INSTAGRAM_SCOPES ?? "instagram_basic").split(","),
    },
    create: {
      userId,
      provider: "instagram",
      accessToken: encrypted,
      expiresAt,
      status: "connected",
      scopes: (process.env.INSTAGRAM_SCOPES ?? "instagram_basic").split(","),
    },
  });
}

export async function getInstagramAccount(userId: string) {
  const account = await db.integrationAccount.findUnique({
    where: { userId_provider: { userId, provider: "instagram" } },
  });
  if (!account?.accessToken) return null;
  return {
    ...account,
    accessToken: decryptSecret(account.accessToken),
  };
}

export function instagramShareFallback(url?: string) {
  return {
    supported: false,
    action: "open_and_share" as const,
    message: "Open Instagram & Share",
    url: url ?? "https://www.instagram.com/",
    reason:
      "Direct posting from third-party apps is only available for supported Instagram professional accounts with approved permissions. US360 will never automate Instagram in the browser.",
  };
}
