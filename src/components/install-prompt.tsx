"use client";

import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "meethub:install-dismissed";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

/**
 * "Add to home screen" suggestion. On Android/desktop Chrome it captures the
 * native `beforeinstallprompt` and installs on tap. iOS Safari has no such API,
 * so we show the manual Share → Add to Home Screen instructions instead.
 * Hidden when already installed or recently dismissed.
 */
export function InstallPrompt() {
  const t = useTranslations("Pwa");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    if (standalone) return;

    const last = Number(localStorage.getItem(KEY) ?? 0);
    if (last && Date.now() - last < SNOOZE_MS) return;

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      const id = setTimeout(() => {
        setIsIOS(true);
        setVisible(true);
      }, 3500);
      return () => clearTimeout(id);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function snooze() {
    localStorage.setItem(KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    snooze();
  }

  if (!visible) return null;

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in fixed bottom-24 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 duration-300 md:bottom-4">
      <div className="bg-popover ring-foreground/10 flex items-start gap-3 rounded-2xl p-4 shadow-xl ring-1 backdrop-blur">
        <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Logo className="size-7" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("title")}</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {isIOS ? t("iosBody") : t("body")}
          </p>

          {!isIOS && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={install}>
                <Download className="size-4" aria-hidden />
                {t("install")}
              </Button>
              <Button size="sm" variant="ghost" onClick={snooze}>
                {t("later")}
              </Button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={snooze}
          aria-label={t("later")}
          className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 shrink-0 rounded-full p-1"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
