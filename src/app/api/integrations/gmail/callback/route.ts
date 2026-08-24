import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { appUrl } from "@/lib/env";
import { connectGmailFromCode } from "@/integrations/gmail";

export async function GET(req: Request) {
  const err = new URL("/settings?gmail=error", appUrl());
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      return NextResponse.redirect(new URL(`/settings?gmail=${oauthError === "access_denied" ? "denied" : "error"}`, appUrl()));
    }
    const cookieStore = await cookies();
    const expected = cookieStore.get("gmail_oauth_state")?.value;
    if (!code || !state || !expected || state !== expected || !state.startsWith(`${user.id}.`)) {
      return NextResponse.redirect(err);
    }
    await connectGmailFromCode(user.id, code);
    const ok = new URL("/settings?gmail=connected", appUrl());
    const res = NextResponse.redirect(ok);
    res.cookies.set("gmail_oauth_state", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  } catch {
    return NextResponse.redirect(err);
  }
}
