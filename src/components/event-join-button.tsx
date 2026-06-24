"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { joinEvent, leaveEvent } from "@/server/actions/event";

export function EventJoinButton({
  eventId,
  joined,
  disabled,
}: {
  eventId: string;
  joined: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("Event");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = joined ? await leaveEvent(eventId) : await joinEvent(eventId);
      if (res?.error) setError(t(`joinError.${res.error}`));
    });
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={onClick}
        disabled={pending || disabled}
        variant={joined ? "outline" : "default"}
        size="lg"
      >
        {joined ? t("leave") : t("join")}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
