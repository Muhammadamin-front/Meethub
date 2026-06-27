/**
 * Removes all seed/fake data from the database.
 * Run with: npm run db:unseed
 *
 * Seed users have clerkId starting with "seed_". Deleting them cascades to
 * their organizations, events, registrations, and messages via onDelete: Cascade.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const eventsDeleted = await prisma.event.deleteMany({
    where: { id: { startsWith: "seed_evt_" } },
  });
  console.log(`Deleted ${eventsDeleted.count} seed events`);

  const usersDeleted = await prisma.user.deleteMany({
    where: { clerkId: { startsWith: "seed_" } },
  });
  console.log(`Deleted ${usersDeleted.count} seed users (+ their organizations)`);

  console.log("Done. Seed data removed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
