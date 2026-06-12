-- Expand library catalog according to professional cataloging requirements.
ALTER TYPE "LibraryItemKind" ADD VALUE IF NOT EXISTS 'SCIENTIFIC_ARTICLE';
ALTER TYPE "LibraryItemKind" ADD VALUE IF NOT EXISTS 'PHYSICAL_BOOK';
ALTER TYPE "LibraryItemKind" ADD VALUE IF NOT EXISTS 'DIGITAL_BOOK';
ALTER TYPE "LibraryItemKind" ADD VALUE IF NOT EXISTS 'BOOK_CHAPTER';
ALTER TYPE "LibraryItemKind" ADD VALUE IF NOT EXISTS 'TECHNICAL_INSTITUTIONAL_PRODUCTION';
ALTER TYPE "LibraryItemKind" ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE "LibraryItemKind" ADD VALUE IF NOT EXISTS 'LEARNING_OBJECT';

CREATE TYPE "LibraryCopyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'BORROWED', 'DISCARDED', 'UNAVAILABLE');
CREATE TYPE "LibraryContributorType" AS ENUM ('PERSON', 'ENTITY');

ALTER TABLE "LibraryItem" ADD COLUMN "issn" TEXT;
ALTER TABLE "LibraryItem" ADD COLUMN "callNumber" TEXT;
ALTER TABLE "LibraryItem" ADD COLUMN "consultationCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "LibraryReservation" ADD COLUMN "copyId" TEXT;
ALTER TABLE "LibraryReservation" ADD COLUMN "renewedCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "LibraryCopy" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "callNumber" TEXT,
  "location" TEXT,
  "status" "LibraryCopyStatus" NOT NULL DEFAULT 'AVAILABLE',
  "discardReason" TEXT,
  "discardedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LibraryCopy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LibraryContributor" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "LibraryContributorType" NOT NULL DEFAULT 'PERSON',
  "relationTerm" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LibraryContributor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LibraryCopy_itemId_code_key" ON "LibraryCopy"("itemId", "code");
CREATE INDEX "LibraryCopy_itemId_status_idx" ON "LibraryCopy"("itemId", "status");
CREATE INDEX "LibraryContributor_name_idx" ON "LibraryContributor"("name");
CREATE INDEX "LibraryContributor_itemId_idx" ON "LibraryContributor"("itemId");
CREATE INDEX "LibraryItem_isbn_idx" ON "LibraryItem"("isbn");
CREATE INDEX "LibraryItem_issn_idx" ON "LibraryItem"("issn");
CREATE INDEX "LibraryReservation_copyId_status_idx" ON "LibraryReservation"("copyId", "status");

ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "LibraryCopy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LibraryCopy" ADD CONSTRAINT "LibraryCopy_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryContributor" ADD CONSTRAINT "LibraryContributor_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one available copy per existing physical item when useful.
INSERT INTO "LibraryCopy" ("id", "itemId", "code", "callNumber", "location", "status", "createdAt", "updatedAt")
SELECT
  'copy_' || substr(md5(random()::text || "id"), 1, 20),
  "id",
  'EX-001',
  "callNumber",
  "location",
  CASE WHEN "availableCopies" > 0 AND "status" = 'AVAILABLE' THEN 'AVAILABLE'::"LibraryCopyStatus" ELSE 'UNAVAILABLE'::"LibraryCopyStatus" END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "LibraryItem"
WHERE "isDigital" = false AND "totalCopies" > 0
ON CONFLICT DO NOTHING;

CREATE TABLE "LibraryConsultation" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LibraryConsultation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LibraryConsultation_itemId_createdAt_idx" ON "LibraryConsultation"("itemId", "createdAt");
CREATE INDEX "LibraryConsultation_userId_createdAt_idx" ON "LibraryConsultation"("userId", "createdAt");
ALTER TABLE "LibraryConsultation" ADD CONSTRAINT "LibraryConsultation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryConsultation" ADD CONSTRAINT "LibraryConsultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
