"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import {
  NotificationType,
  OrgStatus,
  UserRole,
} from "@/generated/prisma/client";
import { organizationApplicationSchema } from "@/lib/validations/organization";
import { requireAdmin, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email";
import { createNotification } from "@/server/notifications";
import { rateLimit } from "@/server/rate-limit";

export type ApplyState = {
  fieldErrors?: Partial<Record<"name" | "description", string[]>>;
  error?: string;
};

/**
 * A signed-in user applies to host events. Creates a PENDING organization and
 * promotes the user to the ORGANIZATION role. Enforced server-side: one org per
 * user (Organization.ownerUserId is unique).
 */
export async function applyForOrganization(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const user = await requireUser();
  const locale = await getLocale();

  if (!rateLimit(`org-apply:${user.id}`, 5, 3_600_000)) {
    const tc = await getTranslations("Common");
    return { error: tc("rateLimited") };
  }

  const parsed = organizationApplicationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const existing = await prisma.organization.findUnique({
    where: { ownerUserId: user.id },
  });
  if (existing) {
    // Already applied — show the status page instead.
    redirect(`/${locale}/organizations/apply`);
  }

  await prisma.$transaction([
    prisma.organization.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        ownerUserId: user.id,
        status: OrgStatus.PENDING,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ORGANIZATION },
    }),
  ]);

  revalidatePath(`/${locale}/organizations/apply`);
  redirect(`/${locale}/organizations/apply`);
}

/** Admin: verify a pending organization. */
export async function approveOrganization(organizationId: string) {
  await requireAdmin();
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { status: OrgStatus.VERIFIED },
    include: { owner: { select: { id: true, email: true } } },
  });

  await createNotification({
    userId: org.ownerUserId,
    type: NotificationType.ORG_APPROVED,
    title: "Organization approved",
    body: `Your organization "${org.name}" was approved.`,
    data: { org: org.name },
  });
  await sendEmail(
    org.owner.email,
    "Your organization was approved",
    `<p>Good news! Your organization <strong>${org.name}</strong> has been approved. You can now create events on MeetHub.</p>`,
  );

  revalidatePath("/admin/organizations");
}

/** Admin: reject an organization application. */
export async function rejectOrganization(organizationId: string) {
  await requireAdmin();
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { status: OrgStatus.REJECTED },
  });

  await createNotification({
    userId: org.ownerUserId,
    type: NotificationType.ORG_REJECTED,
    title: "Organization not approved",
    body: `Your organization "${org.name}" was not approved.`,
    data: { org: org.name },
  });

  revalidatePath("/admin/organizations");
}

/**
 * Admin: permanently delete an organization. Its events (and their
 * registrations, messages, media, reviews) cascade away via the schema. The
 * owner keeps their account but is demoted back to a regular USER so they can
 * re-apply later.
 */
export async function deleteOrganization(organizationId: string) {
  await requireAdmin();

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerUserId: true },
  });
  if (!org) return;

  await prisma.$transaction([
    prisma.organization.delete({ where: { id: organizationId } }),
    // Only demote if they were an organizer (never touch an admin's role).
    prisma.user.updateMany({
      where: { id: org.ownerUserId, role: UserRole.ORGANIZATION },
      data: { role: UserRole.USER },
    }),
  ]);

  revalidatePath("/admin/organizations");
}
