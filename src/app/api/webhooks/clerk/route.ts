import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { prisma } from "@/server/db";

// Clerk -> DB user sync. Configure this URL in the Clerk Dashboard (Webhooks)
// and set CLERK_WEBHOOK_SIGNING_SECRET in the environment. The route is public;
// authenticity is enforced by Svix signature verification.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const data = evt.data;
      const email =
        data.email_addresses.find((e) => e.id === data.primary_email_address_id)
          ?.email_address ??
        data.email_addresses[0]?.email_address ??
        null;
      const phone =
        data.phone_numbers.find((p) => p.id === data.primary_phone_number_id)
          ?.phone_number ??
        data.phone_numbers[0]?.phone_number ??
        null;
      const name =
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        email ||
        phone ||
        "User";

      await prisma.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          name,
          email,
          phone,
          imageUrl: data.image_url,
        },
        // Don't overwrite role/reputation/block fields managed by the app.
        update: { name, email, phone, imageUrl: data.image_url },
      });
      break;
    }

    case "user.deleted": {
      if (evt.data.id) {
        await prisma.user.deleteMany({ where: { clerkId: evt.data.id } });
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
