import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, extras?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extras }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Invalid request", 422, {
      issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return jsonError("Please sign in to continue.", 401);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return jsonError("You do not have access to this resource.", 403);
  }
  if (error instanceof Error && error.message === "AI_LIMIT") {
    return jsonError("You’ve reached today’s AI limit. You can still write manually.", 429);
  }
  if (error instanceof Error && error.message === "AI_PARSE") {
    return jsonError("The assistant couldn’t format a reply. Please try again.", 502);
  }
  console.error(error);
  const message = error instanceof Error ? error.message : "";
  if (
    /Can't reach database|P1001|P1017|does not exist|P2021|P2022|Environment variable not found: DATABASE_URL|Authentication failed/i.test(
      message,
    )
  ) {
    return jsonError(
      "The database is not connected yet. Add Postgres in Vercel (Storage → Postgres), set AUTH_SECRET, then Redeploy.",
      503,
    );
  }
  return jsonError("Something went wrong. Please try again.", 500);
}
