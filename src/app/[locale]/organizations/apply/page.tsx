import { getTranslations, setRequestLocale } from "next-intl/server";

import { OrgApplicationForm } from "@/components/org-application-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrgStatus } from "@/generated/prisma/client";
import { getOwnedOrganization, requireUser } from "@/server/auth";

const STATUS_KEY = {
  [OrgStatus.PENDING]: "pending",
  [OrgStatus.VERIFIED]: "verified",
  [OrgStatus.REJECTED]: "rejected",
} as const;

export default async function OrganizationApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(); // must be signed in to apply
  const t = await getTranslations("Org");

  const org = await getOwnedOrganization();

  if (org) {
    const key = STATUS_KEY[org.status];
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{t(`status.${key}Title`)}</CardTitle>
            <CardDescription>
              {t(`status.${key}Body`, { name: org.name })}
            </CardDescription>
          </CardHeader>
          {org.status === OrgStatus.VERIFIED && (
            <CardContent>
              {/* Full nav: bypass the `(.)events/new` modal interceptor. */}
              <a href={`/${locale}/events/new`} className={buttonVariants()}>
                {t("status.createEvent")}
              </a>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("apply.title")}
      </h1>
      <p className="text-muted-foreground mt-1">{t("apply.subtitle")}</p>
      <div className="mt-8">
        <OrgApplicationForm />
      </div>
    </div>
  );
}
