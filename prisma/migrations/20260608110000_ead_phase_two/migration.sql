CREATE TYPE "EadResourceKind" AS ENUM ('PDF', 'DOCUMENT', 'LINK', 'VIDEO');

ALTER TABLE "EadCourse" ADD COLUMN "allowedDepartments" "Department"[] NOT NULL DEFAULT ARRAY[]::"Department"[];

CREATE TABLE "EadLessonRating" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EadLessonRating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EadResource" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "kind" "EadResourceKind" NOT NULL DEFAULT 'PDF',
  "url" TEXT NOT NULL,
  "department" "Department" NOT NULL,
  "allowedDepartments" "Department"[] NOT NULL DEFAULT ARRAY[]::"Department"[],
  "isGlobal" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "courseId" TEXT,
  "lessonId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EadResource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EadLessonRating_lessonId_userId_key" ON "EadLessonRating"("lessonId", "userId");
CREATE INDEX "EadLessonRating_lessonId_rating_idx" ON "EadLessonRating"("lessonId", "rating");
CREATE INDEX "EadLessonRating_userId_createdAt_idx" ON "EadLessonRating"("userId", "createdAt");
CREATE INDEX "EadResource_department_isPublished_sortOrder_idx" ON "EadResource"("department", "isPublished", "sortOrder");
CREATE INDEX "EadResource_isGlobal_isPublished_sortOrder_idx" ON "EadResource"("isGlobal", "isPublished", "sortOrder");
CREATE INDEX "EadResource_courseId_idx" ON "EadResource"("courseId");
CREATE INDEX "EadResource_lessonId_idx" ON "EadResource"("lessonId");

ALTER TABLE "EadLessonRating" ADD CONSTRAINT "EadLessonRating_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "EadLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EadLessonRating" ADD CONSTRAINT "EadLessonRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EadResource" ADD CONSTRAINT "EadResource_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "EadCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EadResource" ADD CONSTRAINT "EadResource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "EadLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EadResource" ADD CONSTRAINT "EadResource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
