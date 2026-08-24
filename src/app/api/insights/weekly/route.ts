import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { generateWeeklyFocus } from "@/ai/services";
import { localDateKey } from "@/lib/utils";
import { appUrl } from "@/lib/env";

export async function POST() {
  try {
    const user = await requireUser();
    const copy = await generateWeeklyFocus(user.id);
    const weekStart = new Date(localDateKey(user.timezone));
    const focus = await db.weeklyFocus.upsert({
      where: { userId_weekStart: { userId: user.id, weekStart } },
      update: { title: copy.title, body: copy.body },
      create: { userId: user.id, weekStart, title: copy.title, body: copy.body },
    });
    return jsonOk(focus);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const copy = await generateWeeklyFocus(user.id);
    const weekStart = new Date(localDateKey(user.timezone));
    await db.weeklyFocus.upsert({
      where: { userId_weekStart: { userId: user.id, weekStart } },
      update: { title: copy.title, body: copy.body },
      create: { userId: user.id, weekStart, title: copy.title, body: copy.body },
    });
    return NextResponse.redirect(new URL("/insights", appUrl()));
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({ id: z.string(), completed: z.boolean() });

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const focus = await db.weeklyFocus.update({
      where: { id: body.id },
      data: { completed: body.completed, completedAt: body.completed ? new Date() : null },
    });
    if (focus.userId !== user.id) return jsonOk({ ok: false });
    return jsonOk(focus);
  } catch (error) {
    return handleApiError(error);
  }
}
