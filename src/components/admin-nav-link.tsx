import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { UserRole } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth";

/**
 * Renders an "Admin" link only for admins. Async server component; safe to drop
 * into the (sync) header. Returns null for everyone else.
 */
export async function AdminNavLink() {
  const user = await getCurrentUser();
  if (user?.role !== UserRole.ADMIN) return null;

  const t = await getTranslations("Nav");
  return (
    <Link
      href="/admin"
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      {t("admin")}
    </Link>
  );
}
