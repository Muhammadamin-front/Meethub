/**
 * Media-upload helpers shared by client (Vercel Blob upload) and server
 * (validation). No server-only import: safe in both environments.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

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

// Vercel Blob public URLs look like:
//   https://<store-id>.public.blob.vercel-storage.com/<path>
const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

/**
 * Whether upload UI should be shown. The Blob token is server-only, so the
 * client gates on this public flag (set NEXT_PUBLIC_UPLOADS_ENABLED=true once a
 * Blob store is connected in Vercel). Defaults off so it degrades gracefully.
 */
export function isUploadEnabled() {
  return process.env.NEXT_PUBLIC_UPLOADS_ENABLED === "true";
}

/**
 * Server-side validation of an upload before persisting it: the URL must be a
 * Vercel Blob URL, the resource type allowed, and the size within limits. The
 * authoritative content-type/size limits are also enforced when the upload
 * token is minted (see /api/upload).
 */
export function validateUpload(
  info: UploadInfo,
  allow: "image" | "video" | "both",
): UploadError | null {
  let host: string;
  try {
    host = new URL(info.url).host;
  } catch {
    return "invalid";
  }
  if (!BLOB_HOST.test(host)) return "invalid";
  if (info.resourceType !== "image" && info.resourceType !== "video") {
    return "invalidType";
  }
  if (allow !== "both" && info.resourceType !== allow) return "invalidType";
  const max = info.resourceType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (info.bytes > max) return "tooLarge";
  return null;
}
