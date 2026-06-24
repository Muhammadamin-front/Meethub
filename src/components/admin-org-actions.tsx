"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { OrgStatus } from "@/generated/prisma/client";
import {
  approveOrganization,
  deleteOrganization,
  rejectOrganization,
} from "@/server/actions/organization";

export function AdminOrgActions({
  organizationId,
  status,
}: {
  organizationId: string;
  status: OrgStatus;
}) {
  const t = useTranslations("Admin");
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(() => deleteOrganization(organizationId));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" && (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(() => approveOrganization(organizationId))
            }
          >
            {t("approve")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(() => rejectOrganization(organizationId))
            }
          >
            {t("reject")}
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" aria-hidden />
        {t("delete")}
      </Button>
    </div>
  );
}
