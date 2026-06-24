"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { MediaUpload } from "@/components/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LOCATION_SUGGESTIONS } from "@/lib/constants";
import type { EventFormState } from "@/server/actions/event";

type Action = (
  state: EventFormState,
  formData: FormData,
) => Promise<EventFormState>;

type Defaults = {
  title?: string;
  description?: string;
  location?: string;
  category?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number | string;
  coverUrl?: string;
};

export function EventForm({
  action,
  defaults,
  mode,
}: {
  action: Action;
  defaults?: Defaults;
  mode: "create" | "edit";
}) {
  const t = useTranslations("Event.form");
  const [state, formAction, pending] = useActionState(action, {});
  const [coverUrl, setCoverUrl] = useState(defaults?.coverUrl ?? "");
  const err = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5">
      <Field label={t("title")} error={err?.title && t("titleError")}>
        <Input
          name="title"
          required
          defaultValue={defaults?.title}
          placeholder={t("titlePlaceholder")}
        />
      </Field>

      <Field
        label={t("description")}
        error={err?.description && t("descriptionError")}
      >
        <Textarea
          name="description"
          rows={5}
          required
          defaultValue={defaults?.description}
          placeholder={t("descriptionPlaceholder")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("location")}
          error={err?.location && t("locationError")}
        >
          <>
            <Input
              list="location-suggestions"
              name="location"
              required
              defaultValue={defaults?.location}
              placeholder={t("locationPlaceholder")}
            />
            <datalist id="location-suggestions">
              {LOCATION_SUGGESTIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </>
        </Field>
        <Field
          label={t("category")}
          error={err?.category && t("categoryError")}
        >
          <Input
            name="category"
            required
            defaultValue={defaults?.category}
            placeholder={t("categoryPlaceholder")}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("startsAt")}
          error={err?.startsAt && t("startsAtError")}
        >
          <Input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={defaults?.startsAt}
          />
        </Field>
        <Field label={t("endsAt")} error={err?.endsAt && t("endsAtError")}>
          <Input
            type="datetime-local"
            name="endsAt"
            required
            defaultValue={defaults?.endsAt}
          />
        </Field>
      </div>

      <Field label={t("capacity")} error={err?.capacity && t("capacityError")}>
        <Input
          type="number"
          name="capacity"
          min={1}
          required
          defaultValue={defaults?.capacity}
          className="sm:max-w-40"
        />
      </Field>

      <div className="space-y-2">
        <Label htmlFor="coverUrl">{t("coverUrl")}</Label>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="aspect-video w-full rounded-lg border object-cover"
          />
        )}
        <div className="flex items-center gap-2">
          {/* Paste any image URL (works without Cloudinary) or upload one. */}
          <Input
            id="coverUrl"
            type="url"
            name="coverUrl"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder={t("coverUrlPlaceholder")}
          />
          <MediaUpload
            accept="image"
            label={t("uploadCover")}
            onUploaded={(info) => setCoverUrl(info.url)}
          />
          {coverUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCoverUrl("")}
            >
              {t("removeCover")}
            </Button>
          )}
        </div>
        {err?.coverUrl && (
          <p className="text-destructive text-sm">{t("coverUrlError")}</p>
        )}
      </div>

      {mode === "create" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="publish"
            defaultChecked
            className="border-input accent-primary size-4 rounded"
          />
          {t("publishNow")}
        </label>
      )}

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {mode === "create"
          ? pending
            ? t("submitting")
            : t("submit")
          : pending
            ? t("saving")
            : t("save")}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | false;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
