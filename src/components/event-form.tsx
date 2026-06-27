"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { EventThemePicker } from "@/components/event-theme-picker";
import { LocationPicker } from "@/components/location-picker";
import { MediaUpload } from "@/components/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EVENT_CATEGORIES,
  type EventThemeId,
  UZ_CITIES,
} from "@/lib/constants";
import type { EventFormState } from "@/server/actions/event";

type Action = (
  state: EventFormState,
  formData: FormData,
) => Promise<EventFormState>;

type Defaults = {
  title?: string;
  description?: string;
  location?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: string;
  theme?: EventThemeId;
  startsAt?: string;
  endsAt?: string;
  capacity?: number | string;
  coverUrl?: string;
  registrationUrl?: string;
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
  const tMedia = useTranslations("Media");
  const [state, formAction, pending] = useActionState(action, {});
  const [coverUrl, setCoverUrl] = useState(defaults?.coverUrl ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
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

      <LocationPicker
        defaultLocation={defaults?.location}
        defaultLat={defaults?.latitude}
        defaultLng={defaults?.longitude}
        error={err?.location && t("locationError")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("category")}
          error={err?.category && t("categoryError")}
        >
          <select
            name="category"
            required
            defaultValue={defaults?.category ?? ""}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              {t("categoryPlaceholder")}
            </option>
            {/* Preserve a legacy/custom category that isn't in the preset list. */}
            {defaults?.category &&
              !EVENT_CATEGORIES.includes(
                defaults.category as (typeof EVENT_CATEGORIES)[number],
              ) && (
                <option value={defaults.category}>{defaults.category}</option>
              )}
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("city")} error={err?.city && t("cityError")}>
          <select
            name="city"
            required
            defaultValue={defaults?.city ?? ""}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              {t("cityPlaceholder")}
            </option>
            {UZ_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <EventThemePicker defaultTheme={defaults?.theme} />

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
          {/* Paste any image URL, or upload one to Vercel Blob. */}
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
            onError={(e) => setUploadError(tMedia(`error.${e}`))}
            onUploaded={(info) => {
              setUploadError(null);
              setCoverUrl(info.url);
            }}
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
        {(uploadError || err?.coverUrl) && (
          <p className="text-destructive text-sm">
            {uploadError ?? t("coverUrlError")}
          </p>
        )}
      </div>

      <Field
        label={t("registrationUrl")}
        error={err?.registrationUrl && t("registrationUrlError")}
      >
        <Input
          type="url"
          name="registrationUrl"
          defaultValue={defaults?.registrationUrl ?? ""}
          placeholder={t("registrationUrlPlaceholder")}
        />
        <p className="text-muted-foreground text-xs">{t("registrationUrlHint")}</p>
      </Field>

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
