"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { MediaType } from "@/generated/prisma/client";
import {
  validateUpload,
  type UploadError,
  type UploadInfo,
} from "@/lib/cloudinary";
import { getEventAccess, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";

export type MediaResult = { error?: UploadError | "forbidden" | "rateLimited" };

/** Update the current user's profile picture from a Cloudinary upload. */
export async function updateAvatar(info: UploadInfo): Promise<MediaResult> {
  const user = await requireUser();
  const err = validateUpload(info, "image");
  if (err) return { error: err };

  await prisma.user.update({
    where: { id: user.id },
    data: { imageUrl: info.url },
  });
  const locale = await getLocale();
  revalidatePath(`/${locale}/dashboard`);
  return {};
}

// Avatars are resized client-side to a small square and stored inline as a
// data URL, so changing the photo works without Cloudinary (or any external
// service). Cap the encoded size to keep the row small. ~400 KB of base64 is
// far more than a 256px JPEG needs, but leaves headroom.
const MAX_AVATAR_CHARS = 400_000;
const AVATAR_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

/** Update the current user's profile picture from a resized data URL. */
export async function updateAvatarImage(
  dataUrl: string,
): Promise<MediaResult> {
  const user = await requireUser();

  if (!rateLimit(`avatar:${user.id}`, 15, 3_600_000)) {
    return { error: "rateLimited" };
  }
  if (typeof dataUrl !== "string" || !AVATAR_DATA_URL.test(dataUrl)) {
    return { error: "invalid" };
  }
  if (dataUrl.length > MAX_AVATAR_CHARS) {
    return { error: "tooLarge" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { imageUrl: dataUrl },
  });
  const locale = await getLocale();
  revalidatePath(`/${locale}/dashboard`);
  return {};
}

/** Add an image/video to an event's gallery (registrants + owner/admin only). */
export async function addEventMedia(
  eventId: string,
  info: UploadInfo,
): Promise<MediaResult> {
  const access = await getEventAccess(eventId);
  if (!access || !access.canRead) return { error: "forbidden" };
  if (!rateLimit(`media:${access.user.id}`, 20, 60_000)) {
    return { error: "rateLimited" };
  }

  const err = validateUpload(info, "both");
  if (err) return { error: err };

  await prisma.eventMedia.create({
    data: {
      eventId,
      userId: access.user.id,
      url: info.url,
      type: info.resourceType === "video" ? MediaType.VIDEO : MediaType.IMAGE,
    },
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/events/${eventId}`);
  return {};
}
