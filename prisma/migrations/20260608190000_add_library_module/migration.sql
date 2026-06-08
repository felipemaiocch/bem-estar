CREATE TYPE "LibraryItemKind" AS ENUM (
  'BOOK',
  'ARTICLE',
  'LEGISLATION',
  'THESIS',
  'VIDEO',
  'MOVIE',
  'DOCUMENT',
  'HANDOUT',
  'COURSE',
  'LECTURE',
  'EXTERNAL_SITE',
  'ASSESSMENT',
  'TRAINING'
);

CREATE TYPE "LibraryItemStatus" AS ENUM (
  'AVAILABLE',
  'UNAVAILABLE',
  'ARCHIVED'
);

CREATE TYPE "LibraryReservationStatus" AS ENUM (
  'RESERVED',
  'BORROWED',
  'RETURNED',
  'CANCELED',
  'OVERDUE'
);

CREATE TABLE "LibraryItem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "author" TEXT,
  "publisher" TEXT,
  "year" INTEGER,
  "isbn" TEXT,
  "category" TEXT NOT NULL,
  "kind" "LibraryItemKind" NOT NULL DEFAULT 'BOOK',
  "description" TEXT,
  "coverUrl" TEXT,
  "materialUrl" TEXT,
  "location" TEXT,
  "totalCopies" INTEGER NOT NULL DEFAULT 1,
  "availableCopies" INTEGER NOT NULL DEFAULT 1,
  "isReservable" BOOLEAN NOT NULL DEFAULT true,
  "isDigital" BOOLEAN NOT NULL DEFAULT false,
  "status" "LibraryItemStatus" NOT NULL DEFAULT 'AVAILABLE',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LibraryReservation" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "LibraryReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "borrowedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  "notes" TEXT,

  CONSTRAINT "LibraryReservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LibraryItem_kind_category_status_idx" ON "LibraryItem"("kind", "category", "status");
CREATE INDEX "LibraryItem_title_idx" ON "LibraryItem"("title");
CREATE INDEX "LibraryReservation_itemId_status_idx" ON "LibraryReservation"("itemId", "status");
CREATE INDEX "LibraryReservation_userId_status_reservedAt_idx" ON "LibraryReservation"("userId", "status", "reservedAt");

ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
