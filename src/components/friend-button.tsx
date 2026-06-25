"use client";

import { Check, UserMinus, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { FriendState } from "@/lib/social";
import {
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from "@/server/actions/social";

export function FriendButton({
  targetId,
  state,
}: {
  targetId: string;
  state: FriendState;
}) {
  const t = useTranslations("Social");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    start(() => {
      void fn();
    });

  if (state === "self") return null;

  if (state === "friends") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => removeFriend(targetId))}
      >
        <Check className="size-4" />
        {t("friends")}
      </Button>
    );
  }

  if (state === "outgoing") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => removeFriend(targetId))}
      >
        {t("requested")}
      </Button>
    );
  }

  if (state === "incoming") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => respondFriendRequest(targetId, true))}
        >
          <Check className="size-4" />
          {t("accept")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(() => respondFriendRequest(targetId, false))}
        >
          <X className="size-4" />
          {t("decline")}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => run(() => sendFriendRequest(targetId))}
    >
      <UserPlus className="size-4" />
      {t("addFriend")}
    </Button>
  );
}

/** Standalone "remove friend" for the friends list. */
export function RemoveFriendButton({ targetId }: { targetId: string }) {
  const t = useTranslations("Social");
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(() => {
          void removeFriend(targetId);
        })
      }
      aria-label={t("remove")}
    >
      <UserMinus className="size-4" />
    </Button>
  );
}
