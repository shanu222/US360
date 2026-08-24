import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireUser } from "@/server/auth";
import { jsonError } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { gmailAuthUrl, gmailOAuthConfigured } from "@/integrations/google-oauth";

export async function GET() {
  try {
    const user = await requireUser();
    if (!gmailOAuthConfigured()) {
      return NextResponse.redirect(new URL("/settings?gmail=setup", appUrl()));
    }
    const state = `${user.id}.${randomBytes(16).toString("hex")}`;
    const res = NextResponse.redirect(gmailAuthUrl(state));
    res.cookies.set("gmail_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch {
    return jsonError("Please sign in to continue.", 401);
  }
}
