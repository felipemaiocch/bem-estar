import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { AdminPermission } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";
import { adminPermissionOptions } from "@/lib/admin-permission-options";
import { prisma } from "@/lib/prisma";

const pagePermissionMap: Array<{ prefix: string; permission: AdminPermission }> = [
  { prefix: "/admin/usuarios", permission: "USERS" },
  { prefix: "/admin/ead", permission: "EAD" },
  { prefix: "/admin/biblioteca", permission: "LIBRARY" },
  { prefix: "/admin/eventos", permission: "EVENTS" },
  { prefix: "/admin/profissionais", permission: "PROFESSIONALS" },
  { prefix: "/admin/conteudos", permission: "CONTENTS" },
  { prefix: "/admin/gamificacao", permission: "GAMIFICATION" },
  { prefix: "/admin/relatorios", permission: "REPORTS" },
  { prefix: "/admin/compliance", permission: "COMPLIANCE" },
  { prefix: "/admin/moderacao", permission: "MODERATION" },
  { prefix: "/admin/notificacoes", permission: "NOTIFICATIONS" },
  { prefix: "/admin", permission: "DASHBOARD" },
];

export function hasAdminPermission(
  permissions: AdminPermission[] | null | undefined,
  permission: AdminPermission,
) {
  return !permissions || permissions.length === 0 || permissions.includes(permission);
}

export function isMasterAdmin(permissions: AdminPermission[] | null | undefined) {
  return !permissions || permissions.length === 0;
}

export function getAdminPermissionForPath(pathname: string) {
  return pagePermissionMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))?.permission ?? "DASHBOARD";
}

export function getFirstAllowedAdminPath(permissions: AdminPermission[] | null | undefined) {
  if (isMasterAdmin(permissions)) return "/admin";

  const first = adminPermissionOptions.find((permission) => permissions?.includes(permission.value));
  return first?.href ?? "/403";
}

export async function getAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      adminPermissions: true,
    },
  });

  return user?.role === "ADMIN" ? user : null;
}

export async function ensureAdminPagePermission(pathname: string) {
  const token = (await cookies()).get(authCookieName)?.value;

  if (!token) redirect("/");

  const session = await verifyToken(token);

  if (!session || session.role !== "ADMIN") redirect("/403");

  const access = await getAdminAccess(session.sub);

  if (!access) redirect("/403");

  const neededPermission = getAdminPermissionForPath(pathname);

  if (!hasAdminPermission(access.adminPermissions, neededPermission)) {
    redirect(getFirstAllowedAdminPath(access.adminPermissions));
  }
}

export async function requireAdminPermission(
  request: NextRequest,
  permission: AdminPermission,
) {
  const token = request.cookies.get(authCookieName)?.value;

  if (!token) {
    return {
      response: NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 }),
    };
  }

  const session = await verifyToken(token);

  if (!session || session.role !== "ADMIN") {
    return {
      response: NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 }),
    };
  }

  const access = await getAdminAccess(session.sub);

  if (!access || !hasAdminPermission(access.adminPermissions, permission)) {
    return {
      response: NextResponse.json({ ok: false, error: "Você não tem permissão para este módulo." }, { status: 403 }),
    };
  }

  return { session, permissions: access.adminPermissions };
}
