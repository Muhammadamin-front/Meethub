"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markAttendance } from "@/server/actions/attendance";

type RegStatus = "JOINED" | "ATTENDED" | "NO_SHOW";

export function AttendanceActions({
  eventId,
  userId,
  status,
}: {
  eventId: string;
  userId: string;
  status: RegStatus;
}) {
  const t = useTranslations("Attendance");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={status === "ATTENDED" ? "default" : "outline"}
        disabled={pending}
        onClick={() =>
          startTransition(() => markAttendance(eventId, userId, "ATTENDED"))
        }
      >
        {t("attended")}
      </Button>
      <Button
        size="sm"
        variant={status === "NO_SHOW" ? "destructive" : "outline"}
        disabled={pending}
        onClick={() =>
          startTransition(() => markAttendance(eventId, userId, "NO_SHOW"))
        }
      >
        {t("noShow")}
      </Button>
    </div>
  );
}
