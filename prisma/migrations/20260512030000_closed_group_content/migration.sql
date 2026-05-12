ALTER TABLE "Event" ADD COLUMN "accessGroupId" TEXT;
ALTER TABLE "EngagementCard" ADD COLUMN "accessGroupId" TEXT;

CREATE INDEX "Event_accessGroupId_idx" ON "Event"("accessGroupId");
CREATE INDEX "EngagementCard_accessGroupId_idx" ON "EngagementCard"("accessGroupId");

ALTER TABLE "Event" ADD CONSTRAINT "Event_accessGroupId_fkey" FOREIGN KEY ("accessGroupId") REFERENCES "AccessGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngagementCard" ADD CONSTRAINT "EngagementCard_accessGroupId_fkey" FOREIGN KEY ("accessGroupId") REFERENCES "AccessGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
