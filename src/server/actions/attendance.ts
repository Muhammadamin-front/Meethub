"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import {
  NotificationType,
  RegistrationStatus,
} from "@/generated/prisma/client";
import {
  MAX_REPUTATION,
  MIN_REPUTATION,
  NO_SHOW_REPUTATION_PENALTY,
} from "@/lib/constants";
import { requireManageableEvent } from "@/server/auth";
import { prisma } from "@/server/db";
import { createNotification } from "@/server/notifications";

/**
 * Reputation impact of a registration status. Only NO_SHOW costs reputation,
 * which keeps re-marking fully reversible (delta = effect(new) - effect(old)).
 */
function reputationEffect(status: RegistrationStatus): number {
  return status === RegistrationStatus.NO_SHOW
    ? -NO_SHOW_REPUTATION_PENALTY
    : 0;
}

const clamp = (n: number) =>
  Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, n));

/**
 * Organization (or admin) marks a participant ATTENDED or NO_SHOW. Adjusts the
 * user's reputation in the same transaction.
 */
export async function markAttendance(
  eventId: string,
  userId: string,
  next: "ATTENDED" | "NO_SHOW",
) {
  const { event } = await requireManageableEvent(eventId); // owner org or admin
  const locale = await getLocale();
  const nextStatus =
    next === "ATTENDED"
      ? RegistrationStatus.ATTENDED
      : RegistrationStatus.NO_SHOW;

  let changed = false;
  await prisma.$transaction(async (tx) => {
    const reg = await tx.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!reg || reg.status === nextStatus) return;
    changed = true;

    const delta = reputationEffect(nextStatus) - reputationEffect(reg.status);

    await tx.registration.update({
      where: { id: reg.id },
      data: { status: nextStatus, markedAt: new Date() },
    });

    if (delta !== 0) {
      const u = await tx.user.findUnique({
        where: { id: userId },
        select: { reputation: true },
      });
      if (u) {
        await tx.user.update({
          where: { id: userId },
          data: { reputation: clamp(u.reputation + delta) },
        });
      }
    }
  });

  if (changed) {
    await createNotification({
      userId,
      type: NotificationType.ATTENDANCE_MARKED,
      title: "Attendance recorded",
      body: `Your attendance for "${event.title}" was recorded.`,
      data: { event: event.title },
    });
  }

  revalidatePath(`/${locale}/events/${eventId}/attendance`);
}
