"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { MediaType } from "@/generated/prisma/client";
import {
  validateUpload,
  type UploadError,
  type UploadInfo,
} from "@/lib/upload";
import { getEventAccess } from "@/server/auth";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";

export type MediaResult = { error?: UploadError | "forbidden" | "rateLimited" };

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
