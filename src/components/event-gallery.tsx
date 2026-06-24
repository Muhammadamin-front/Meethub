"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { MediaUpload } from "@/components/media-upload";
import { addEventMedia } from "@/server/actions/media";

type Item = { id: string; url: string; type: "IMAGE" | "VIDEO" };

export function EventGallery({
  eventId,
  items,
  canUpload,
}: {
  eventId: string;
  items: Item[];
  canUpload: boolean;
}) {
  const t = useTranslations("Media");
  const [media, setMedia] = useState<Item[]>(items);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("galleryTitle")}</h2>
        {canUpload && (
          <MediaUpload
            accept="both"
            label={t("addMedia")}
            disabled={pending}
            onUploaded={(info) =>
              startTransition(async () => {
                setError(null);
                const res = await addEventMedia(eventId, info);
                if (res.error) {
                  setError(t(`error.${res.error}`));
                } else {
                  setMedia((prev) => [
                    {
                      id: crypto.randomUUID(),
                      url: info.url,
                      type: info.resourceType === "video" ? "VIDEO" : "IMAGE",
                    },
                    ...prev,
                  ]);
                }
              })
            }
          />
        )}
      </div>

      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

      {media.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          {t("galleryEmpty")}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) =>
            m.type === "VIDEO" ? (
              <video
                key={m.id}
                src={m.url}
                controls
                className="aspect-square w-full rounded-lg border object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.id}
                src={m.url}
                alt=""
                className="aspect-square w-full rounded-lg border object-cover"
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}
