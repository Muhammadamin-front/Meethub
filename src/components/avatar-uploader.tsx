"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { MediaUpload } from "@/components/media-upload";
import { updateAvatar } from "@/server/actions/media";

export function AvatarUploader({
  currentUrl,
  name,
}: {
  currentUrl: string | null;
  name: string;
}) {
  const t = useTranslations("Media");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-full">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="size-full object-cover" />
        )}
      </div>
      <div className="space-y-1">
        <MediaUpload
          accept="image"
          label={t("changePhoto")}
          disabled={pending}
          onUploaded={(info) =>
            startTransition(async () => {
              setError(null);
              const res = await updateAvatar(info);
              if (res.error) {
                setError(t(`error.${res.error}`));
              } else {
                setUrl(info.url);
                router.refresh();
              }
            })
          }
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
}
