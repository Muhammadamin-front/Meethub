"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { EventStatus, RegistrationStatus } from "@/generated/prisma/client";
import { eventSchema, type EventField } from "@/lib/validations/event";
import {
  isUserBlocked,
  requireManageableEvent,
  requireUser,
  requireVerifiedOrganization,
} from "@/server/auth";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";

export type EventFormState = {
  fieldErrors?: Partial<Record<EventField, string[]>>;
  error?: string;
};

export type JoinResult = {
  error?: "full" | "blocked" | "unavailable" | "owner" | "rateLimited";
};

const ACTIVE: RegistrationStatus[] = [
  RegistrationStatus.JOINED,
  RegistrationStatus.ATTENDED,
];

function parse(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    category: formData.get("category"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity"),
    coverUrl: formData.get("coverUrl") ?? "",
    latitude: formData.get("latitude") ?? "",
    longitude: formData.get("longitude") ?? "",
  });
}

/** Normalize the optional ""-or-number coordinate fields to number | null. */
function coords(d: { latitude?: number | ""; longitude?: number | "" }) {
  const latitude = typeof d.latitude === "number" ? d.latitude : null;
  const longitude = typeof d.longitude === "number" ? d.longitude : null;
  // Only keep coordinates when BOTH are present.
  return latitude !== null && longitude !== null
    ? { latitude, longitude }
    : { latitude: null, longitude: null };
}

// ---- Org: create / edit / publish / cancel --------------------------------

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { organization } = await requireVerifiedOrganization();
  const locale = await getLocale();

  if (!rateLimit(`event-create:${organization.id}`, 10, 3_600_000)) {
    const tc = await getTranslations("Common");
    return { error: tc("rateLimited") };
  }

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const d = parsed.data;

  // "Publish now" is checked by default in the form; uncheck to save a draft.
  const publish = formData.get("publish") === "on";

  const event = await prisma.event.create({
    data: {
      organizationId: organization.id,
      title: d.title,
      description: d.description,
      location: d.location,
      category: d.category,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      capacity: d.capacity,
      coverUrl: d.coverUrl || null,
      ...coords(d),
      status: publish ? EventStatus.PUBLISHED : EventStatus.DRAFT,
    },
  });

  revalidatePath(`/${locale}/events`);
  redirect(`/${locale}/events/${event.id}`);
}

export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireManageableEvent(eventId);
  const locale = await getLocale();

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const d = parsed.data;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: d.title,
      description: d.description,
      location: d.location,
      category: d.category,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      capacity: d.capacity,
      coverUrl: d.coverUrl || null,
      ...coords(d),
    },
  });

  redirect(`/${locale}/events/${eventId}`);
}

export async function publishEvent(eventId: string) {
  await requireManageableEvent(eventId);
  const locale = await getLocale();
  await prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.PUBLISHED },
  });
  revalidatePath(`/${locale}/events`);
  revalidatePath(`/${locale}/events/${eventId}`);
  revalidatePath(`/${locale}/dashboard`);
}

export async function cancelEvent(eventId: string) {
  await requireManageableEvent(eventId);
  const locale = await getLocale();
  await prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.CANCELLED },
  });
  revalidatePath(`/${locale}/events`);
  revalidatePath(`/${locale}/events/${eventId}`);
  revalidatePath(`/${locale}/dashboard`);
}

// ---- User: join / leave ----------------------------------------------------

export async function joinEvent(eventId: string): Promise<JoinResult> {
  const user = await requireUser();
  if (isUserBlocked(user)) return { error: "blocked" };
  if (!rateLimit(`join:${user.id}`, 20, 60_000))
    return { error: "rateLimited" };
  const locale = await getLocale();

  const result = await prisma.$transaction(async (tx): Promise<JoinResult> => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { organization: { select: { ownerUserId: true } } },
    });
    if (!event || event.status !== EventStatus.PUBLISHED) {
      return { error: "unavailable" };
    }
    if (event.organization.ownerUserId === user.id) {
      return { error: "owner" };
    }

    const existing = await tx.registration.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing && ACTIVE.includes(existing.status)) {
      return {}; // already in
    }

    const taken = await tx.registration.count({
      where: { eventId, status: { in: ACTIVE } },
    });
    if (taken >= event.capacity) {
      return { error: "full" };
    }

    await tx.registration.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      create: { eventId, userId: user.id, status: RegistrationStatus.JOINED },
      update: { status: RegistrationStatus.JOINED },
    });
    return {};
  });

  revalidatePath(`/${locale}/events/${eventId}`);
  return result;
}

export async function leaveEvent(eventId: string): Promise<JoinResult> {
  const user = await requireUser();
  const locale = await getLocale();

  // Only allow leaving while still merely JOINED (not after attendance marked).
  await prisma.registration.deleteMany({
    where: { eventId, userId: user.id, status: RegistrationStatus.JOINED },
  });

  revalidatePath(`/${locale}/events/${eventId}`);
  return {};
}
