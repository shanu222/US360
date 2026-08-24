import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    await req.json();
  } catch {
    /* Meta status callbacks are accepted even if unused */
  }
  return NextResponse.json({ ok: true });
}
