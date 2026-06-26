import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/server/auth";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("Profile");

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>

      <div className="mt-6">
        <ProfileForm nickname={user.nickname ?? ""} city={user.city ?? ""} />
      </div>
    </div>
  );
}
