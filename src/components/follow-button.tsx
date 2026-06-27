"use client";

import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/server/actions/follow";

/** Optimistic follow / unfollow toggle for an organization. */
export function FollowButton({
  organizationId,
  initialFollowing,
  size = "sm",
}: {
  organizationId: string;
  initialFollowing: boolean;
  size?: "sm" | "default";
}) {
  const t = useTranslations("Org");
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function onClick() {
    const next = !following;
    setFollowing(next); // optimistic
    startTransition(async () => {
      const res = await toggleFollow(organizationId);
      if (res.error) setFollowing(!next); // revert
      else if (typeof res.following === "boolean") setFollowing(res.following);
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={following ? "outline" : "default"}
      onClick={onClick}
      disabled={pending}
    >
      {following ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Plus className="size-4" aria-hidden />
      )}
      {following ? t("following") : t("follow")}
    </Button>
  );
}
