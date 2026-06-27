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

export type CheckInResult = {
  ok?: boolean;
  error?:
    | "notJoined"
    | "notLive"
    | "noLocation"
    | "tooFar"
    | "blocked"
    | "rateLimited";
};

const ACTIVE: RegistrationStatus[] = [
  RegistrationStatus.JOINED,
  RegistrationStatus.ATTENDED,
];

// Self check-in is allowed this far from the venue (metres). Generous to absorb
// phone GPS error, especially indoors.
const CHECK_IN_RADIUS_M = 200;
// ...and from this long before the start until the end.
const CHECK_IN_EARLY_MS = 60 * 60 * 1000; // 1h

/** Great-circle distance between two lat/lng points, in metres. */
function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

function parse(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    city: formData.get("city") ?? undefined,
    category: formData.get("category"),
    theme: formData.get("theme") ?? undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity"),
    coverUrl: formData.get("coverUrl") ?? "",
    registrationUrl: formData.get("registrationUrl") ?? "",
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

  await prisma.event.create({
    data: {
      organizationId: organization.id,
      title: d.title,
      description: d.description,
      location: d.location,
      city: d.city?.trim() || null,
      category: d.category,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      capacity: d.capacity,
      theme: d.theme,
      coverUrl: d.coverUrl || null,
      registrationUrl: d.registrationUrl || null,
      ...coords(d),
      status: publish ? EventStatus.PUBLISHED : EventStatus.DRAFT,
    },
  });

  revalidatePath(`/${locale}/events`);
  // Go to the events list (not /events/[id], which the modal interceptor would
  // catch as a soft-nav and leave the form stuck open behind it).
  redirect(`/${locale}/events`);
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
      city: d.city?.trim() || null,
      category: d.category,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      capacity: d.capacity,
      theme: d.theme,
      coverUrl: d.coverUrl || null,
      registrationUrl: d.registrationUrl || null,
      ...coords(d),
    },
  });

  revalidatePath(`/${locale}/events`);
  revalidatePath(`/${locale}/events/${eventId}`);
  // Back to the list — redirecting to /events/[id] would be intercepted into a
  // modal over the edit page, trapping the user in an edit/modal loop.
  redirect(`/${locale}/events`);
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
    // Time matters: you can't join an event that has already ended.
    if (event.endsAt < new Date()) {
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

/**
 * Geofenced self check-in: a registered participant marks themselves ATTENDED
 * by being physically at the venue during the event. We verify their browser
 * coordinates are within {@link CHECK_IN_RADIUS_M} of the event's location and
 * that it's within the event's time window — so it can't be done from home.
 */
export async function checkInEvent(
  eventId: string,
  lat: number,
  lng: number,
): Promise<CheckInResult> {
  const user = await requireUser();
  if (isUserBlocked(user)) return { error: "blocked" };
  if (!rateLimit(`checkin:${user.id}`, 10, 60_000)) {
    return { error: "rateLimited" };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "noLocation" };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      startsAt: true,
      endsAt: true,
      latitude: true,
      longitude: true,
    },
  });
  if (!event) return { error: "notLive" };
  if (event.latitude == null || event.longitude == null) {
    return { error: "noLocation" };
  }

  const now = Date.now();
  if (
    now < event.startsAt.getTime() - CHECK_IN_EARLY_MS ||
    now > event.endsAt.getTime()
  ) {
    return { error: "notLive" };
  }

  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (!reg || !ACTIVE.includes(reg.status)) return { error: "notJoined" };
  if (reg.status === RegistrationStatus.ATTENDED) return { ok: true }; // already

  const meters = distanceMeters(lat, lng, event.latitude, event.longitude);
  if (meters > CHECK_IN_RADIUS_M) return { error: "tooFar" };

  await prisma.registration.update({
    where: { eventId_userId: { eventId, userId: user.id } },
    data: { status: RegistrationStatus.ATTENDED, markedAt: new Date() },
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/events/${eventId}`);
  return { ok: true };
}
