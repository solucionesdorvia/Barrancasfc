-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "Event_seriesId_idx" ON "Event"("seriesId");
