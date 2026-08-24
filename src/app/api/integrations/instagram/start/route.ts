import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { instagramAuthUrl, instagramConfigured } from "@/integrations/instagram";
import { jsonError } from "@/lib/api";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const user = await requireUser();
    if (!instagramConfigured()) {
      return jsonError("Instagram connection unavailable. You can still open Instagram manually.", 503);
    }
    const state = `${user.id}.${randomBytes(8).toString("hex")}`;
    const res = NextResponse.redirect(instagramAuthUrl(state));
    res.cookies.set("ig_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
    return res;
  } catch {
    return jsonError("Please sign in to continue.", 401);
  }
}
