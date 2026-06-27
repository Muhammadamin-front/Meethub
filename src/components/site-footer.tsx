import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tn = useTranslations("Nav");

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-semibold">
              <Logo className="size-6" />
              <span className="text-lg tracking-tight">
                Meet<span className="text-primary">Hub</span>
              </span>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">{t("tagline")}</p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterCol title={t("explore")}>
              <FooterLink href="/events">{tn("events")}</FooterLink>
              <FooterLink href="/leaderboard">{tn("leaderboard")}</FooterLink>
              <FooterLink href="/organizations">
                {tn("organizations")}
              </FooterLink>
            </FooterCol>

            <FooterCol title={t("community")}>
              <FooterLink href="/people">{tn("people")}</FooterLink>
              <FooterLink href="/events/new">{tn("create")}</FooterLink>
              <FooterLink href="/organizations/apply">
                {tn("organizations")}
              </FooterLink>
            </FooterCol>

            <FooterCol title={t("social")}>
              <li>
                <a
                  href="https://t.me/meethub"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
                >
                  <Send className="size-3.5" aria-hidden />
                  Telegram
                </a>
              </li>
            </FooterCol>
          </div>
        </div>

        <div className="text-muted-foreground mt-10 border-t pt-6 text-sm">
          {t("rights", { year: new Date().getFullYear(), app: APP_NAME })}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
