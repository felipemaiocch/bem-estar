CREATE TYPE "AdminPermission" AS ENUM (
  'USERS',
  'EAD',
  'LIBRARY',
  'EVENTS',
  'PROFESSIONALS',
  'CONTENTS',
  'GAMIFICATION',
  'REPORTS',
  'COMPLIANCE',
  'MODERATION',
  'NOTIFICATIONS',
  'DASHBOARD'
);

ALTER TABLE "User" ADD COLUMN "adminPermissions" "AdminPermission"[] NOT NULL DEFAULT ARRAY[]::"AdminPermission"[];
