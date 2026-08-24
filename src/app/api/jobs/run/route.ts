import { runAllJobs } from "@/jobs/runner";
import { jsonError, jsonOk } from "@/lib/api";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? req.headers.get("x-cron-secret");
  if (process.env.NODE_ENV === "production" && !secret) {
    return false;
  }
  if (!secret) return true;
  return header === `Bearer ${secret}` || header === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return jsonError("Unauthorized", 401);
  }
  await runAllJobs();
  return jsonOk({ ran: true });
}

export async function GET(req: Request) {
  return POST(req);
}
