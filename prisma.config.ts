// Prisma 7 config. `dotenv/config` loads .env so the URLs below are available
// to the CLI (migrate, db push, studio, seed).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrate/Studio use the DIRECT (non-pooled) connection when available;
    // the app runtime uses the pooled DATABASE_URL via the pg adapter.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
