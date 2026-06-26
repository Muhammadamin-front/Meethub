/**
 * Media-upload helpers shared by client (Cloudinary signed upload) and server
 * (validation). No server-only import: safe in both environments.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export type UploadInfo = {
  url: string;
  resourceType: "image" | "video";
  bytes: number;
};

export type UploadError =
  | "notConfigured"
  | "invalid"
  | "invalidType"
  | "tooLarge";

export function cloudName() {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

/**
 * Event-card cover source. Falls back to the bundled graphic, and rewrites
 * Cloudinary URLs to auto-format/auto-quality delivery (webp/avif + sane
 * compression) so cards don't download full-size originals.
 */
export function coverSrc(url: string | null | undefined): string {
  if (!url) return "/assets/event-bg.jpg";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_auto,q_auto/");
  }
  return url;
}

/**
 * Whether the upload UI should be shown. Gated only on the public flag — the
 * client doesn't need the cloud name (the signing route returns it). If the
 * server keys are missing, clicking surfaces a "notConfigured" error instead of
 * a silently disabled button.
 */
export function isUploadEnabled() {
  return process.env.NEXT_PUBLIC_UPLOADS_ENABLED === "true";
}

/**
 * Server-side validation of an upload before persisting it: the URL must belong
 * to our Cloudinary cloud, the resource type must be allowed, and the size must
 * be within limits.
 */
export function validateUpload(
  info: UploadInfo,
  allow: "image" | "video" | "both",
): UploadError | null {
  const name = cloudName();
  if (!name) return "notConfigured";

  let url: URL;
  try {
    url = new URL(info.url);
  } catch {
    return "invalid";
  }
  // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/meethub/abc.jpg
  if (
    url.host !== "res.cloudinary.com" ||
    !url.pathname.startsWith(`/${name}/`)
  ) {
    return "invalid";
  }

  if (info.resourceType !== "image" && info.resourceType !== "video") {
    return "invalidType";
  }
  if (allow !== "both" && info.resourceType !== allow) return "invalidType";
  const max = info.resourceType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (info.bytes > max) return "tooLarge";
  return null;
}
