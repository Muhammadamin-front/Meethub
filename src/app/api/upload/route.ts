import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { ALLOWED_CONTENT_TYPES, MAX_VIDEO_BYTES } from "@/lib/upload";
import { getCurrentUser } from "@/server/auth";

/**
 * Mints short-lived client upload tokens for Vercel Blob. Only signed-in,
 * non-blocked users may upload; the token restricts content types and size, so
 * a client can't be coerced into uploading something we don't allow. Files go
 * straight from the browser to Blob storage (never through this server).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user || user.isBlocked) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          // Scope blobs under the uploader so they're easy to attribute/clean.
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      // Nothing to persist here — callers store the returned URL via their own
      // server action (which re-validates it).
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
