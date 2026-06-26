"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { UZ_CITIES } from "@/lib/constants";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";

export type NameResult = { error?: "invalid" | "rateLimited" };

export type ProfileResult = {
  ok?: boolean;
  error?: "invalidNickname" | "invalidCity" | "rateLimited";
};

/**
 * Save the app-specific profile fields (nickname + city) the user fills in
 * after signing up. Until both are set, the header shows a red dot.
 */
export async function updateProfile(
  nickname: string,
  city: string,
): Promise<ProfileResult> {
  const user = await requireUser();
  if (!rateLimit(`profile:${user.id}`, 20, 3_600_000)) {
    return { error: "rateLimited" };
  }

  const nick = nickname.trim();
  if (nick.length < 2 || nick.length > 30) {
    return { error: "invalidNickname" };
  }
  const c = city.trim();
  if (!UZ_CITIES.some((x) => x.name === c)) {
    return { error: "invalidCity" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { nickname: nick, city: c },
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/profile`);
  revalidatePath(`/${locale}/dashboard`);
  return { ok: true };
}

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
