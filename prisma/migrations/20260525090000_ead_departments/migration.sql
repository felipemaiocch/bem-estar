CREATE TYPE "Department" AS ENUM ('COMERCIAL', 'FINANCEIRO', 'ATENDIMENTO');

CREATE TYPE "EadLessonKind" AS ENUM ('VIDEO', 'PDF', 'TUTORIAL');

ALTER TYPE "ScoringAction" ADD VALUE IF NOT EXISTS 'EAD_LESSON';

ALTER TABLE "User" ADD COLUMN "department" "Department";
ALTER TABLE "User" ADD COLUMN "drCoins" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "EadCourse" (
  "id" TEXT NOT NULL,
  "department" "Department" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EadCourse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EadLesson" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "kind" "EadLessonKind" NOT NULL DEFAULT 'VIDEO',
  "videoUrl" TEXT,
  "materialUrl" TEXT,
  "durationMinutes" INTEGER,
  "quizQuestion" TEXT,
  "quizOptions" JSONB,
  "correctAnswerIndex" INTEGER,
  "pointsReward" INTEGER NOT NULL DEFAULT 20,
  "coinsReward" INTEGER NOT NULL DEFAULT 5,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EadLesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EadLessonCompletion" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "selectedAnswerIndex" INTEGER,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
  "coinsAwarded" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EadLessonCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EadCourse_department_title_key" ON "EadCourse"("department", "title");
CREATE INDEX "EadCourse_department_isPublished_sortOrder_idx" ON "EadCourse"("department", "isPublished", "sortOrder");

CREATE UNIQUE INDEX "EadLesson_courseId_title_key" ON "EadLesson"("courseId", "title");
CREATE INDEX "EadLesson_courseId_isPublished_sortOrder_idx" ON "EadLesson"("courseId", "isPublished", "sortOrder");

CREATE UNIQUE INDEX "EadLessonCompletion_lessonId_userId_key" ON "EadLessonCompletion"("lessonId", "userId");
CREATE INDEX "EadLessonCompletion_userId_completedAt_idx" ON "EadLessonCompletion"("userId", "completedAt");
CREATE INDEX "EadLessonCompletion_lessonId_idx" ON "EadLessonCompletion"("lessonId");

ALTER TABLE "EadLesson" ADD CONSTRAINT "EadLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "EadCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EadLessonCompletion" ADD CONSTRAINT "EadLessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "EadLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EadLessonCompletion" ADD CONSTRAINT "EadLessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
