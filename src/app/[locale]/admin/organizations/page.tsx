import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminOrgActions } from "@/components/admin-org-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrgStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

const STATUS_KEY = {
  [OrgStatus.PENDING]: "pending",
  [OrgStatus.VERIFIED]: "verified",
  [OrgStatus.REJECTED]: "rejected",
} as const;

const STATUS_VARIANT = {
  [OrgStatus.PENDING]: "secondary",
  [OrgStatus.VERIFIED]: "default",
  [OrgStatus.REJECTED]: "destructive",
} as const;

export default async function AdminOrganizationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const t = await getTranslations("Admin");

  // PENDING sorts first (enum declaration order), newest within a status first.
  const organizations = await prisma.organization.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { owner: { select: { name: true, email: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("orgsTitle")}
      </h1>
      <p className="text-muted-foreground mt-1">{t("orgsSubtitle")}</p>

      {organizations.length === 0 ? (
        <p className="text-muted-foreground mt-12">{t("noPending")}</p>
      ) : (
        <div className="mt-8 space-y-3">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{org.name}</CardTitle>
                  <Badge variant={STATUS_VARIANT[org.status]}>
                    {t(STATUS_KEY[org.status])}
                  </Badge>
                </div>
                <CardDescription>
                  {t("owner")}: {org.owner.name}
                  {org.owner.email ? ` · ${org.owner.email}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {org.description}
                </p>
                <AdminOrgActions
                  organizationId={org.id}
                  status={org.status}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
