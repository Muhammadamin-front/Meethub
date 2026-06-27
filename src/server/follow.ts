import "server-only";

import { EventStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

/** Set of organization ids the user follows (for marking follow buttons). */
export async function getFollowedOrgIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.follow.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  return new Set(rows.map((r) => r.organizationId));
}

/** Does this user follow this organization? */
export async function isFollowing(
  userId: string | null,
  organizationId: string,
): Promise<boolean> {
  if (!userId) return false;
  const row = await prisma.follow.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return !!row;
}

export function followerCount(organizationId: string) {
  return prisma.follow.count({ where: { organizationId } });
}

/** Follower counts for many orgs at once (one query). */
export async function followerCounts(
  organizationIds: string[],
): Promise<Map<string, number>> {
  if (organizationIds.length === 0) return new Map();
  const groups = await prisma.follow.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: organizationIds } },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [g.organizationId, g._count._all]));
}

/** Upcoming events from organizations the user follows (the Following feed). */
export async function getFollowedUpcomingEvents(userId: string) {
  const followed = await prisma.follow.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const orgIds = followed.map((f) => f.organizationId);
  if (orgIds.length === 0) return [];

  return prisma.event.findMany({
    where: {
      organizationId: { in: orgIds },
      status: EventStatus.PUBLISHED,
      endsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: 50,
    include: { organization: { select: { name: true } } },
  });
}
