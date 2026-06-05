ALTER TABLE "EadCourse" ADD COLUMN "isGlobal" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "EadCourse_isGlobal_isPublished_sortOrder_idx" ON "EadCourse"("isGlobal", "isPublished", "sortOrder");
