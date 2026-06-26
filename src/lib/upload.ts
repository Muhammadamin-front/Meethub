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
 * Whether the upload UI should be shown. Gated on a public flag plus a real
 * cloud name so it degrades gracefully until Cloudinary is configured.
 */
export function isUploadEnabled() {
  const name = cloudName();
  return (
    process.env.NEXT_PUBLIC_UPLOADS_ENABLED === "true" &&
    !!name &&
    !/^your-cloud/i.test(name)
  );
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
