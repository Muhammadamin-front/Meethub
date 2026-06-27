import { getTranslations, setRequestLocale } from "next-intl/server";

import { FollowButton } from "@/components/follow-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { followerCounts, getFollowedOrgIds } from "@/server/follow";

export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Org");

  const organizations = await prisma.organization.findMany({
    where: { status: OrgStatus.VERIFIED },
    orderBy: { createdAt: "desc" },
  });

  const user = await getCurrentUser();
  const [followed, counts] = await Promise.all([
    user ? getFollowedOrgIds(user.id) : Promise.resolve(new Set<string>()),
    followerCounts(organizations.map((o) => o.id)),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href="/organizations/apply"
          className={buttonVariants({ size: "sm" })}
        >
          {t("becomeOrganizer")}
        </Link>
      </div>

      {organizations.length === 0 ? (
        <p className="text-muted-foreground mt-12">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-muted-foreground line-clamp-3 flex-1 text-sm">
                  {org.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground text-xs">
                    {t("followers", { count: counts.get(org.id) ?? 0 })}
                  </span>
                  {user && org.ownerUserId !== user.id && (
                    <FollowButton
                      organizationId={org.id}
                      initialFollowing={followed.has(org.id)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
