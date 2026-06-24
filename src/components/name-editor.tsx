"use client";

import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileName } from "@/server/actions/profile";

export function NameEditor({
  currentName,
  display,
  isEmailName,
}: {
  currentName: string;
  display: string;
  /** True when the stored name is just the email (no real name yet). */
  isEmailName: boolean;
}) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  // Start blank when there's no real name yet, so the user types a fresh one.
  const [value, setValue] = useState(isEmailName ? "" : currentName);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    startTransition(async () => {
      setError(null);
      const res = await updateProfileName(value);
      if (res.error) {
        setError(t(`nameError.${res.error}`));
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <p className="font-medium">{display}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("editName")}
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={value}
          maxLength={50}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              setEditing(false);
            }
          }}
          placeholder={t("namePlaceholder")}
          className="h-8 w-44"
        />
        <Button
          type="button"
          size="sm"
          className="size-8 p-0"
          disabled={pending}
          onClick={save}
          aria-label={t("saveName")}
        >
          <Check className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="size-8 p-0"
          disabled={pending}
          onClick={() => setEditing(false)}
          aria-label={t("cancel")}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
