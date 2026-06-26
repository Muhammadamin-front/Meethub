"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { EventStatus, RegistrationStatus } from "@/generated/prisma/client";
import { getCurrentUser, isUserBlocked, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { getPendingReview } from "@/server/reviews";

/**
 * Pending "rate the event" prompt for the current user (null if none). Called
 * from the client after paint so the relation-heavy query never blocks the home
 * page's server render.
 */
export async function fetchPendingReview() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getPendingReview(user.id);
}

export type ReviewResult = {
  error?: "notAllowed" | "notFinished" | "invalid" | "blocked" | "rateLimited";
};

const PARTICIPANT: RegistrationStatus[] = [
  RegistrationStatus.JOINED,
  RegistrationStatus.ATTENDED,
];

/**
 * A participant submits (or updates) their 5-star review for an event. Allowed
 * only after the event has finished, and only by users who joined/attended.
 */
export async function submitReview(
  eventId: string,
  rating: number,
  comment: string,
): Promise<ReviewResult> {
  const user = await requireUser();
  if (isUserBlocked(user)) return { error: "blocked" };
  if (!rateLimit(`review:${user.id}`, 15, 3_600_000)) {
    return { error: "rateLimited" };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "invalid" };
  }
  const trimmed = comment.trim().slice(0, 1000);
  const locale = await getLocale();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true, endsAt: true },
  });
  if (!event) return { error: "notAllowed" };

  const finished =
    event.status === EventStatus.FINISHED || event.endsAt < new Date();
  if (!finished) return { error: "notFinished" };

  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (!reg || !PARTICIPANT.includes(reg.status)) {
    return { error: "notAllowed" };
  }

  await prisma.review.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    create: { eventId, userId: user.id, rating, comment: trimmed || null },
    update: { rating, comment: trimmed || null },
  });

  revalidatePath(`/${locale}/events/${eventId}`);
  return {};
}
