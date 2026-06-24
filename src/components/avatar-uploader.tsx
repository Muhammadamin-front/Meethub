"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateAvatarImage } from "@/server/actions/media";

const AVATAR_SIZE = 256;

/**
 * Resize the chosen image to a centered AVATAR_SIZE square and return a compact
 * JPEG data URL. Keeps the stored avatar tiny so no upload service is needed.
 */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");

  // Cover-crop: scale so the image fills the square, then center it.
  const scale = Math.max(AVATAR_SIZE / bitmap.width, AVATAR_SIZE / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUploader({
  currentUrl,
  name,
}: {
  currentUrl: string | null;
  name: string;
}) {
  const t = useTranslations("Media");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later.
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("error.invalidType"));
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const dataUrl = await fileToAvatarDataUrl(file);
        const res = await updateAvatarImage(dataUrl);
        if (res.error) {
          setError(t(`error.${res.error}`));
        } else {
          setUrl(dataUrl);
          router.refresh();
        }
      } catch {
        setError(t("error.invalid"));
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-full">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="size-full object-cover" />
        )}
      </div>
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? t("uploading") : t("changePhoto")}
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
}
