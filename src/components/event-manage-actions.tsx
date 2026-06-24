"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cancelEvent, publishEvent } from "@/server/actions/event";

// String-literal union mirrors the EventStatus enum without importing the
// (server-only) generated Prisma client into the client bundle.
type EventStatusValue = "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";

export function EventManageActions({
  eventId,
  status,
}: {
  eventId: string;
  status: EventStatusValue;
}) {
  const t = useTranslations("Event");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/events/${eventId}/edit`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {t("edit")}
      </Link>
      <Link
        href={`/events/${eventId}/attendance`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {t("attendance")}
      </Link>

      {status === "DRAFT" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => publishEvent(eventId))}
        >
          {t("publish")}
        </Button>
      )}

      {(status === "DRAFT" || status === "PUBLISHED") && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(() => cancelEvent(eventId))}
        >
          {t("cancelEvent")}
        </Button>
      )}
    </div>
  );
}
