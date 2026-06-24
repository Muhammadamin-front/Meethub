"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  approveOrganization,
  rejectOrganization,
} from "@/server/actions/organization";

export function AdminOrgActions({
  organizationId,
}: {
  organizationId: string;
}) {
  const t = useTranslations("Admin");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
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
    </div>
  );
}
