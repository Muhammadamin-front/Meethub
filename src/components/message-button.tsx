"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { openConversation } from "@/server/actions/dm";

/** Opens (or creates) the DM conversation with a user and navigates to it. */
export function MessageButton({ targetId }: { targetId: string }) {
  const t = useTranslations("Social");
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(() => {
          void openConversation(targetId);
        })
      }
    >
      <MessageCircle className="size-4" />
      {t("message")}
    </Button>
  );
}
