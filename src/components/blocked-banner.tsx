import { getTranslations } from "next-intl/server";

import { getCurrentUser, isUserBlocked } from "@/server/auth";

/** Shows a site-wide banner while the current user is blocked. */
export async function BlockedBanner() {
  const user = await getCurrentUser();
  if (!user || !isUserBlocked(user)) return null;

  const t = await getTranslations("Blocked");
  return (
    <div className="border-destructive/30 bg-destructive/10 border-b">
      <div className="text-destructive mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
        <span className="font-medium">{t("title")}</span> {t("body")}
      </div>
    </div>
  );
}
