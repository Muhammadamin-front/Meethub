"use client";

import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  isUploadEnabled,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  type UploadError,
  type UploadInfo,
} from "@/lib/upload";

/**
 * Uploads a single image/video straight from the browser to Cloudinary using a
 * server-minted signature (/api/cloudinary-sign), then hands the resulting URL
 * back via `onUploaded`. Renders a disabled button until uploads are enabled
 * (NEXT_PUBLIC_UPLOADS_ENABLED + a configured cloud).
 */
export function MediaUpload({
  accept = "image",
  label,
  icon,
  disabled,
  onUploaded,
  onError,
}: {
  accept?: "image" | "video" | "both";
  label: string;
  /** When provided, render an icon-only button (label becomes its tooltip). */
  icon?: React.ReactNode;
  disabled?: boolean;
  onUploaded: (info: UploadInfo) => void;
  onError?: (error: UploadError) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const buttonProps = icon
    ? ({ size: "icon", "aria-label": label, title: label } as const)
    : ({ size: "sm" } as const);

  if (!isUploadEnabled()) {
    return (
      <Button type="button" variant="outline" disabled {...buttonProps}>
        {icon ?? label}
      </Button>
    );
  }

  const acceptAttr =
    accept === "image"
      ? "image/*"
      : accept === "video"
        ? "video/*"
        : "image/*,video/*";

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    if (accept !== "both" && (isVideo ? "video" : "image") !== accept) {
      onError?.("invalidType");
      return;
    }
    const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > max) {
      onError?.("tooLarge");
      return;
    }

    setBusy(true);
    try {
      // 1) Get a one-time signature from our server.
      const sigRes = await fetch("/api/cloudinary-sign", { method: "POST" });
      if (!sigRes.ok) {
        onError?.("notConfigured");
        return;
      }
      const { cloudName, apiKey, timestamp, folder, signature } =
        await sigRes.json();

      // 2) Upload directly to Cloudinary. `auto` handles image + video.
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("folder", folder);
      form.append("signature", signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: form },
      );
      if (!res.ok) {
        onError?.("invalid");
        return;
      }
      const data = await res.json();
      onUploaded({
        url: data.secure_url,
        resourceType: data.resource_type === "video" ? "video" : "image",
        bytes: typeof data.bytes === "number" ? data.bytes : file.size,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      onError?.("invalid");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        hidden
        onChange={onChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        {...buttonProps}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : (icon ?? label)}
      </Button>
    </>
  );
}
