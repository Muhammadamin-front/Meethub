import type { NextRequest } from "next/server";

import { EventStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

/**
 * Marks published events whose end time has passed as FINISHED so the stored
 * status stays accurate. Behaviour already treats `endsAt < now` as finished
 * everywhere (joining is blocked, the UI shows "finished"); this just persists
 * it. Vercel attaches `Authorization: Bearer $CRON_SECRET` automatically.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { count } = await prisma.event.updateMany({
    where: { status: EventStatus.PUBLISHED, endsAt: { lt: new Date() } },
    data: { status: EventStatus.FINISHED },
  });

  return Response.json({ finished: count });
}
