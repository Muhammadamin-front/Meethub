"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyForOrganization,
  type ApplyState,
} from "@/server/actions/organization";

const initialState: ApplyState = {};

export function OrgApplicationForm() {
  const t = useTranslations("Org.apply");
  const [state, formAction, pending] = useActionState(
    applyForOrganization,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          name="name"
          placeholder={t("namePlaceholder")}
          required
          minLength={2}
          maxLength={80}
        />
        {state.fieldErrors?.name && (
          <p className="text-destructive text-sm">{t("nameError")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("descriptionLabel")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder={t("descriptionPlaceholder")}
          required
          minLength={20}
          maxLength={1000}
        />
        {state.fieldErrors?.description && (
          <p className="text-destructive text-sm">{t("descriptionError")}</p>
        )}
      </div>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
