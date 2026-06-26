import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth";

/**
 * Mints a short-lived signature for a direct (browser -> Cloudinary) signed
 * upload. Only signed-in, non-blocked users get one. The API secret never
 * leaves the server — the browser only receives the signature, timestamp,
 * api_key, cloud name and folder.
 */
export async function POST(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user || user.isBlocked) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "notConfigured" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "meethub";

  // Signature = sha1 of the signed params (sorted, joined by &) + api secret.
  // We sign only `folder` and `timestamp`; `file`, `api_key`, `cloud_name` and
  // `resource_type` are never part of the signature.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
