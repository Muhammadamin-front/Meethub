import "server-only";

import { EventStatus, RegistrationStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

const PARTICIPANT: RegistrationStatus[] = [
  RegistrationStatus.JOINED,
  RegistrationStatus.ATTENDED,
];

/**
 * The most recently finished event this user joined/attended but hasn't
 * reviewed yet — drives the one-time "rate this event" prompt on the home page.
 * Returns null when there's nothing pending.
 */
export async function getPendingReview(userId: string) {
  const reg = await prisma.registration.findFirst({
    where: {
      userId,
      status: { in: PARTICIPANT },
      event: {
        endsAt: { lt: new Date() },
        status: { not: EventStatus.CANCELLED },
        reviews: { none: { userId } },
      },
    },
    orderBy: { event: { endsAt: "desc" } },
    select: { event: { select: { id: true, title: true } } },
  });
  return reg?.event ?? null;
}
