import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminUserActions } from "@/components/admin-user-actions";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const t = await getTranslations("AdminUsers");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      reputation: true,
      isBlocked: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">{t("subtitle")}</p>

      <ul className="mt-8 divide-y rounded-lg border">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="flex items-center gap-2 font-medium">
                {u.name}
                {u.isBlocked && (
                  <Badge variant="destructive">{t("blocked")}</Badge>
                )}
              </p>
              <p className="text-muted-foreground text-sm">
                {u.email ?? "—"} · {t("reputation")}: {u.reputation} · {u.role}
              </p>
            </div>
            <AdminUserActions userId={u.id} blocked={u.isBlocked} />
          </li>
        ))}
      </ul>
    </div>
  );
}
