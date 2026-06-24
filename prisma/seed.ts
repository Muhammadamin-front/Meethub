import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

// Relative imports (not the `@/` alias): this runs via tsx, outside Next.
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

/**
 * Promotes the user whose email is SEED_ADMIN_EMAIL to ADMIN.
 *
 * Users are created from Clerk (webhook or first sign-in), so sign in once with
 * that email first, then run `npm run db:seed`.
 */
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) {
    console.error("✖ Set SEED_ADMIN_EMAIL in .env to seed an admin user.");
    process.exitCode = 1;
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`⚠ No user found with email "${email}".`);
      console.warn(
        "  Sign in once with that email so the app creates the user, then re-run `npm run db:seed`.",
      );
      return;
    }

    const admin = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });
    console.log(`✓ Promoted ${admin.email} to ADMIN.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
