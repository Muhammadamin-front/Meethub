"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";

export type FollowResult = { following?: boolean; error?: "rateLimited" };

/** Follow / unfollow an organization (toggle). */
export async function toggleFollow(
  organizationId: string,
): Promise<FollowResult> {
  const user = await requireUser();
  if (!rateLimit(`follow:${user.id}`, 60, 60_000)) {
    return { error: "rateLimited" };
  }

  const key = { userId_organizationId: { userId: user.id, organizationId } };
  const existing = await prisma.follow.findUnique({ where: key });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { userId: user.id, organizationId } });
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/organizations`);
  revalidatePath(`/${locale}/feed`);
  return { following: !existing };
}
