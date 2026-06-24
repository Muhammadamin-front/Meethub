"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";

export type NameResult = { error?: "invalid" | "rateLimited" };

/** Update the current user's display name. */
export async function updateProfileName(name: string): Promise<NameResult> {
  const user = await requireUser();

  if (!rateLimit(`name:${user.id}`, 20, 3_600_000)) {
    return { error: "rateLimited" };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { error: "invalid" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: trimmed },
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/dashboard`);
  return {};
}
