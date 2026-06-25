"use client";

import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { isCloudinaryConfigured, type UploadInfo } from "@/lib/cloudinary";

// Heavy widget (loads Cloudinary's script). Code-split so it's only fetched
// when an upload control is actually rendered (Cloudinary configured), not in
// the initial bundle of every page that has a MediaUpload.
const CldUploadWidget = dynamic(
  () => import("next-cloudinary").then((m) => m.CldUploadWidget),
  { ssr: false },
);

const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function MediaUpload({
  accept = "image",
  label,
  icon,
  disabled,
  onUploaded,
}: {
  accept?: "image" | "video" | "both";
  label: string;
  /** When provided, render an icon-only button (label becomes its tooltip). */
  icon?: React.ReactNode;
  disabled?: boolean;
  onUploaded: (info: UploadInfo) => void;
}) {
  // Icon-only buttons keep `label` as the accessible name + tooltip.
  const buttonProps = icon
    ? ({ size: "icon", "aria-label": label, title: label } as const)
    : ({ size: "sm" } as const);
  const buttonChildren = icon ?? label;

  // Degrade gracefully until Cloudinary is configured.
  if (!isCloudinaryConfigured() || !PRESET) {
    return (
      <Button type="button" variant="outline" disabled {...buttonProps}>
        {buttonChildren}
      </Button>
    );
  }

  return (
    <CldUploadWidget
      uploadPreset={PRESET}
      options={{
        multiple: false,
        maxFiles: 1,
        resourceType: accept === "both" ? "auto" : accept,
        sources: ["local", "url", "camera"],
      }}
      onSuccess={(result) => {
        const info = result.info;
        if (info && typeof info !== "string") {
          onUploaded({
            url: info.secure_url,
            resourceType: info.resource_type === "video" ? "video" : "image",
            bytes: info.bytes,
          });
        }
      }}
    >
      {({ open }) => (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => open()}
          {...buttonProps}
        >
          {buttonChildren}
        </Button>
      )}
    </CldUploadWidget>
  );
}
