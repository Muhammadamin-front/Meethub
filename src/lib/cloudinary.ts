/**
 * Cloudinary helpers shared by client (upload widget) and server (validation).
 * No server-only import: this is safe in both environments.
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

/** True when a real Cloudinary cloud name is set (placeholder => false). */
export function isCloudinaryConfigured() {
  const name = cloudName();
  return !!name && !/^your-cloud/i.test(name);
}

/**
 * Server-side validation of an upload result before persisting it: the URL must
 * belong to our Cloudinary cloud, the resource type must be allowed, and the
 * size must be within limits. (The unsigned upload preset should also restrict
 * formats/size on Cloudinary's side.)
 */
export function validateUpload(
  info: UploadInfo,
  allow: "image" | "video" | "both",
): UploadError | null {
  const name = cloudName();
  if (!name) return "notConfigured";
  if (!info.url.startsWith(`https://res.cloudinary.com/${name}/`)) {
    return "invalid";
  }
  if (allow !== "both" && info.resourceType !== allow) return "invalidType";
  if (info.resourceType !== "image" && info.resourceType !== "video") {
    return "invalidType";
  }
  const max = info.resourceType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (info.bytes > max) return "tooLarge";
  return null;
}
