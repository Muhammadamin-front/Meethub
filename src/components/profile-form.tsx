"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UZ_CITIES } from "@/lib/constants";
import { updateProfile } from "@/server/actions/profile";

const selectClass =
  "border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

export function ProfileForm({
  nickname,
  city,
}: {
  nickname: string;
  city: string;
}) {
  const t = useTranslations("Profile");
  const [nick, setNick] = useState(nickname);
  const [c, setC] = useState(city);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const res = await updateProfile(nick, c);
      if (res.error) setError(t(`error.${res.error}`));
      else setDone(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nickname">{t("nickname")}</Label>
        <Input
          id="nickname"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          maxLength={30}
          placeholder={t("nicknamePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">{t("city")}</Label>
        <select
          id="city"
          value={c}
          onChange={(e) => setC(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            {t("cityPlaceholder")}
          </option>
          {UZ_CITIES.map((x) => (
            <option key={x.name} value={x.name}>
              {x.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {done && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {t("saved")}
        </p>
      )}

      <Button type="button" onClick={save} disabled={pending}>
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
