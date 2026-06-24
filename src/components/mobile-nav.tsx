"use client";

import { useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";

const itemClass =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted";

export function MobileNav() {
  const t = useTranslations("Nav");
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger renders a real <button>, so Base UI button semantics apply. */}
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t("openMenu")}
          />
        }
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{t("menu")}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2 pb-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={itemClass}
            >
              {t(link.key)}
            </Link>
          ))}

          {isSignedIn && (
            <Link href="/dashboard" onClick={close} className={itemClass}>
              {t("dashboard")}
            </Link>
          )}

          {!isSignedIn && (
            <>
              <div className="my-2 border-t" />
              <Link href="/sign-in" onClick={close} className={itemClass}>
                {t("signIn")}
              </Link>
              <Link
                href="/sign-up"
                onClick={close}
                className={cn(buttonVariants(), "w-full")}
              >
                {t("getStarted")}
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
