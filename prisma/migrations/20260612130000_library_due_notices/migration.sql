ALTER TABLE "LibraryReservation"
  ADD COLUMN "dueSoonNotifiedAt" TIMESTAMP(3),
  ADD COLUMN "overdueNotifiedAt" TIMESTAMP(3);

CREATE INDEX "LibraryReservation_dueAt_status_idx" ON "LibraryReservation"("dueAt", "status");
