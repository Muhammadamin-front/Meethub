import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrgStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const t = await getTranslations("Admin");

  const pendingCount = await prisma.organization.count({
    where: { status: OrgStatus.PENDING },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">{t("subtitle")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("orgsTitle")}</CardTitle>
            <CardDescription>{t("orgsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm">
              {t("pendingCount", { count: pendingCount })}
            </span>
            <Link
              href="/admin/organizations"
              className={buttonVariants({ size: "sm" })}
            >
              {t("manageOrgs")}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("usersTitle")}</CardTitle>
            <CardDescription>{t("usersSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-end">
            <Link
              href="/admin/users"
              className={buttonVariants({ size: "sm" })}
            >
              {t("manageUsers")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
