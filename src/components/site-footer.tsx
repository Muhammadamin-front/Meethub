import { useTranslations } from "next-intl";

import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm sm:flex-row sm:px-6">
        <p>{t("rights", { year: new Date().getFullYear(), app: APP_NAME })}</p>
        <p>{t("builtWith")}</p>
      </div>
    </footer>
  );
}
