import type { NextRequest } from "next/server";

import {
  NotificationType,
  RegistrationStatus,
} from "@/generated/prisma/client";
import {
  BLOCK_DURATION_DAYS,
  NO_SHOW_BLOCK_THRESHOLD,
  NO_SHOW_WINDOW_DAYS,
} from "@/lib/constants";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email";
import { createNotification } from "@/server/notifications";

const DAY_MS = 86_400_000;
const BLOCK_REASON = "Too many no-shows in the last 30 days";

/**
 * Daily Vercel Cron job: blocks users with 3+ NO_SHOWs in the trailing 30 days.
 * Vercel attaches `Authorization: Bearer $CRON_SECRET` automatically when the
 * CRON_SECRET env var is set; we verify it so the endpoint can't be abused.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - NO_SHOW_WINDOW_DAYS * DAY_MS);

  const groups = await prisma.registration.groupBy({
    by: ["userId"],
    where: { status: RegistrationStatus.NO_SHOW, markedAt: { gte: cutoff } },
    _count: true,
  });

  const offenders = groups
    .filter((g) => g._count >= NO_SHOW_BLOCK_THRESHOLD)
    .map((g) => g.userId);

  let blocked = 0;
  if (offenders.length > 0) {
    // Fetch the ones not already blocked so we can notify/email each.
    const toBlock = await prisma.user.findMany({
      where: { id: { in: offenders }, isBlocked: false },
      select: { id: true, email: true },
    });

    if (toBlock.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: toBlock.map((u) => u.id) } },
        data: {
          isBlocked: true,
          blockedUntil: new Date(Date.now() + BLOCK_DURATION_DAYS * DAY_MS),
          blockReason: BLOCK_REASON,
        },
      });

      for (const u of toBlock) {
        await createNotification({
          userId: u.id,
          type: NotificationType.BLOCKED,
          title: "Account blocked",
          body: BLOCK_REASON,
          data: { reason: BLOCK_REASON },
        });
        await sendEmail(
          u.email,
          "Your MeetHub account has been blocked",
          `<p>Your MeetHub account has been blocked. Reason: ${BLOCK_REASON}.</p>`,
        );
      }
      blocked = toBlock.length;
    }
  }

  return Response.json({
    checkedUsers: groups.length,
    offenders: offenders.length,
    blocked,
  });
}
