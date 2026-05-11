CREATE TYPE "UserApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "GroupKind" AS ENUM ('COHORT', 'CLASS', 'TAG', 'PROJECT');

CREATE TYPE "GroupMemberRole" AS ENUM ('PARTICIPANT', 'FACILITATOR', 'OWNER');

ALTER TABLE "User"
  ADD COLUMN "approvalStatus" "UserApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "approvalNote" TEXT;

UPDATE "User"
SET "approvedAt" = COALESCE("approvedAt", "createdAt")
WHERE "approvalStatus" = 'APPROVED';

CREATE TABLE "AccessGroup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "kind" "GroupKind" NOT NULL DEFAULT 'COHORT',
  "isRestricted" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccessGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserGroupMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "role" "GroupMemberRole" NOT NULL DEFAULT 'PARTICIPANT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserGroupMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessGroup_slug_key" ON "AccessGroup"("slug");
CREATE INDEX "AccessGroup_kind_isActive_idx" ON "AccessGroup"("kind", "isActive");
CREATE UNIQUE INDEX "UserGroupMembership_userId_groupId_key" ON "UserGroupMembership"("userId", "groupId");
CREATE INDEX "UserGroupMembership_groupId_idx" ON "UserGroupMembership"("groupId");

ALTER TABLE "UserGroupMembership"
  ADD CONSTRAINT "UserGroupMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserGroupMembership"
  ADD CONSTRAINT "UserGroupMembership_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "AccessGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
