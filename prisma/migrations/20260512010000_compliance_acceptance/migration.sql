CREATE TYPE "AcceptanceKind" AS ENUM ('PLATFORM_TERMS');

CREATE TABLE "UserAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AcceptanceKind" NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAcceptance_userId_kind_version_key" ON "UserAcceptance"("userId", "kind", "version");

CREATE INDEX "UserAcceptance_userId_kind_acceptedAt_idx" ON "UserAcceptance"("userId", "kind", "acceptedAt");

ALTER TABLE "UserAcceptance" ADD CONSTRAINT "UserAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
