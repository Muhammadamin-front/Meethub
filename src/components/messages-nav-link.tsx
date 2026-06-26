"use client";

import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useUnreadDms } from "@/lib/use-unread-dms";

/** Desktop Messages nav link with a live red unread-DM badge. */
export function MessagesNavLink({ userId }: { userId: string }) {
  const t = useTranslations("Nav");
  const count = useUnreadDms(userId);

  return (
    <Link
      href="/messages"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "relative",
      )}
    >
      {t("messages")}
      {count > 0 && (
        <span className="bg-destructive absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
