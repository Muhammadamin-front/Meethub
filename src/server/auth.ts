import "server-only";

import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import {
  OrgStatus,
  RegistrationStatus,
  UserRole,
  type User,
} from "@/generated/prisma/client";
import { DEFAULT_REPUTATION } from "@/lib/constants";

import { prisma } from "./db";

/**
 * Auth & permission helpers. All checks are server-side; route handlers, server
 * actions, and Server Components should use these rather than trusting the
 * client. Role-specific gates (organization/admin) are added as later phases
 * need them.
 */

/**
 * Upsert a DB user from the current Clerk session. Used as a fallback when the
 * Clerk webhook hasn't created the row yet (e.g. local dev without a tunnel).
 */
async function syncUserFromClerk(clerkId: string): Promise<User | null> {
  const cu = await currentUser();
  if (!cu) return null;

  const email =
    cu.primaryEmailAddress?.emailAddress ??
    cu.emailAddresses[0]?.emailAddress ??
    null;
  const phone =
    cu.primaryPhoneNumber?.phoneNumber ??
    cu.phoneNumbers[0]?.phoneNumber ??
    null;
  const name =
    [cu.firstName, cu.lastName].filter(Boolean).join(" ") ||
    cu.username ||
    email ||
    phone ||
    "User";

  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      name,
      email,
      phone,
      imageUrl: cu.imageUrl,
      reputation: DEFAULT_REPUTATION,
    },
    update: {},
  });
}

/** Current DB user, or null if signed out. Memoized per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  let user =
    (await prisma.user.findUnique({ where: { clerkId: userId } })) ??
    (await syncUserFromClerk(userId));

  // Auto-promote the configured admin email to ADMIN — no manual seed needed.
  const seedAdmin = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  if (
    user &&
    seedAdmin &&
    user.role !== UserRole.ADMIN &&
    user.email?.toLowerCase() === seedAdmin
  ) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });
  }

  return user;
});

/** Require a signed-in user; redirect to the localized sign-in otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/sign-in`);
  }
  return user;
}

/** Require an ADMIN; redirect to the localized home otherwise. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) {
    const locale = await getLocale();
    redirect(`/${locale}`);
  }
  return user;
}

/** True while a block is active (no end date, or the end date is in the future). */
export function isUserBlocked(user: Pick<User, "isBlocked" | "blockedUntil">) {
  if (!user.isBlocked) return false;
  return !user.blockedUntil || user.blockedUntil > new Date();
}

/** The organization owned by the current user, or null. */
export async function getOwnedOrganization() {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.organization.findUnique({ where: { ownerUserId: user.id } });
}

/**
 * Require the current user to own a VERIFIED organization (needed to create
 * events). Redirects to the application page otherwise.
 */
export async function requireVerifiedOrganization() {
  const user = await requireUser();
  const organization = await prisma.organization.findUnique({
    where: { ownerUserId: user.id },
  });
  if (!organization || organization.status !== OrgStatus.VERIFIED) {
    const locale = await getLocale();
    redirect(`/${locale}/organizations/apply`);
  }
  return { user, organization };
}

/**
 * Require that the current user can manage the given event (the owning org's
 * owner, or an admin). 404 if the event is missing, redirect if not allowed.
 */
export async function requireManageableEvent(eventId: string) {
  const user = await requireUser();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organization: true },
  });
  if (!event) notFound();

  const canManage =
    user.role === UserRole.ADMIN || event.organization.ownerUserId === user.id;
  if (!canManage) {
    const locale = await getLocale();
    redirect(`/${locale}/events/${eventId}`);
  }
  return { user, event };
}

/**
 * Resolve the current user's access to an event's chat. Read access = the
 * owning org / admin, or an active (JOINED/ATTENDED) registrant. Write access
 * additionally requires the user not be blocked. Returns null when signed out
 * or the event doesn't exist.
 */
export async function getEventAccess(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      organization: { select: { ownerUserId: true } },
    },
  });
  if (!event) return null;

  const isManager =
    user.role === UserRole.ADMIN || event.organization.ownerUserId === user.id;

  let isParticipant = false;
  if (!isManager) {
    const reg = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    isParticipant =
      !!reg &&
      (reg.status === RegistrationStatus.JOINED ||
        reg.status === RegistrationStatus.ATTENDED);
  }

  const canRead = isManager || isParticipant;
  return {
    user,
    event,
    isManager,
    canRead,
    canWrite: canRead && !isUserBlocked(user),
  };
}
