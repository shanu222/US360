import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { exchangeInstagramCode, saveInstagramAccount } from "@/integrations/instagram";
import { appUrl } from "@/lib/env";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const errRedirect = new URL("/reels?ig=error", appUrl());
  try {
    const user = await requireUser();
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieStore = await cookies();
    const expected = cookieStore.get("ig_oauth_state")?.value;
    if (!code || !state || state !== expected || !state.startsWith(user.id)) {
      return NextResponse.redirect(errRedirect);
    }
    const token = await exchangeInstagramCode(code);
    await saveInstagramAccount(user.id, token);
    const ok = new URL("/reels?ig=connected", appUrl());
    return NextResponse.redirect(ok);
  } catch {
    return NextResponse.redirect(errRedirect);
  }
}
