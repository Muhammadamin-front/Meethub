"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { blockUser, unblockUser } from "@/server/actions/admin";

export function AdminUserActions({
  userId,
  blocked,
}: {
  userId: string;
  blocked: boolean;
}) {
  const t = useTranslations("AdminUsers");
  const [pending, startTransition] = useTransition();

  return blocked ? (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => unblockUser(userId))}
    >
      {t("unblock")}
    </Button>
  ) : (
    <Button
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => startTransition(() => blockUser(userId))}
    >
      {t("block")}
    </Button>
  );
}
