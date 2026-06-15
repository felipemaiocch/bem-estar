import { NextResponse, type NextRequest } from "next/server";

import { requireAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "COMPLIANCE");

  if (auth.response) {
    return auth.response;
  }

  const [
    totalUsers,
    activeUsers,
    platformAcceptances,
    imageGranted,
    imageRevoked,
    recentAcceptances,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["USER", "PROFESSIONAL", "ADMIN"] } } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.userAcceptance.count({ where: { kind: "PLATFORM_TERMS" } }),
    prisma.imageConsent.count({ where: { granted: true } }),
    prisma.imageConsent.count({ where: { granted: false, revokedAt: { not: null } } }),
    prisma.userAcceptance.findMany({
      take: 12,
      orderBy: { acceptedAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    compliance: {
      totals: {
        totalUsers,
        activeUsers,
        platformAcceptances,
        pendingTerms: Math.max(activeUsers - platformAcceptances, 0),
        imageGranted,
        imageRevoked,
      },
      recentAcceptances: recentAcceptances.map((acceptance) => ({
        id: acceptance.id,
        kind: acceptance.kind,
        version: acceptance.version,
        acceptedAtIso: acceptance.acceptedAt.toISOString(),
        source: acceptance.source,
        user: acceptance.user,
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        createdAtIso: log.createdAt.toISOString(),
        actorName: log.actor?.name ?? "Sistema",
        actorEmail: log.actor?.email ?? null,
      })),
    },
  });
}
