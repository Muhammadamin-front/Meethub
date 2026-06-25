import "server-only";

import { RegistrationStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

const ACTIVE: RegistrationStatus[] = [
  RegistrationStatus.JOINED,
  RegistrationStatus.ATTENDED,
];

export type AttendeePreview = { name: string; imageUrl: string | null };

/**
 * For a set of events, returns a small sample of attendee avatars per event
 * plus the total active count — powers the "who's going" social proof on cards
 * and the detail page in a single pair of queries.
 */
export async function getAttendeeSamples(eventIds: string[], perEvent = 4) {
  const byEvent = new Map<string, AttendeePreview[]>();
  const totals = new Map<string, number>();
  if (eventIds.length === 0) return { byEvent, totals };

  const [regs, counts] = await Promise.all([
    prisma.registration.findMany({
      where: { eventId: { in: eventIds }, status: { in: ACTIVE } },
      select: { eventId: true, user: { select: { name: true, imageUrl: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.registration.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds }, status: { in: ACTIVE } },
      _count: true,
    }),
  ]);

  for (const r of regs) {
    const arr = byEvent.get(r.eventId) ?? [];
    if (arr.length < perEvent) {
      arr.push(r.user);
      byEvent.set(r.eventId, arr);
    }
  }
  for (const c of counts) totals.set(c.eventId, c._count);

  return { byEvent, totals };
}
