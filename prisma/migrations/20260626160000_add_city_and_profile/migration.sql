-- AlterTable
ALTER TABLE "Event" ADD COLUMN "city" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "nickname" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;

-- Index to filter events by city quickly.
CREATE INDEX "Event_city_idx" ON "Event"("city");
