"use server";

import { revalidatePath } from "next/cache";

import { NotificationType } from "@/generated/prisma/client";
import { BLOCK_DURATION_DAYS } from "@/lib/constants";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email";
import { createNotification } from "@/server/notifications";

const BLOCK_REASON = "Manually blocked by an administrator";

/** Admin: manually block a user. */
export async function blockUser(userId: string) {
  await requireAdmin();
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: true,
      blockedUntil: new Date(Date.now() + BLOCK_DURATION_DAYS * 86_400_000),
      blockReason: BLOCK_REASON,
    },
    select: { id: true, email: true },
  });

  await createNotification({
    userId: user.id,
    type: NotificationType.BLOCKED,
    title: "Account blocked",
    body: BLOCK_REASON,
    data: { reason: BLOCK_REASON },
  });
  await sendEmail(
    user.email,
    "Your MeetHub account has been blocked",
    `<p>Your MeetHub account has been blocked. Reason: ${BLOCK_REASON}.</p>`,
  );

  revalidatePath("/admin/users");
}

/** Admin: lift a block. */
export async function unblockUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: false, blockedUntil: null, blockReason: null },
  });
  revalidatePath("/admin/users");
}
