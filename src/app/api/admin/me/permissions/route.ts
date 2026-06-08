import { NextResponse, type NextRequest } from "next/server";

import {
  getAdminAccess,
  isMasterAdmin,
} from "@/lib/admin-permissions";
import { adminPermissionOptions } from "@/lib/admin-permission-options";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const access = await getAdminAccess(auth.session.sub);

  if (!access) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const permissions = isMasterAdmin(access.adminPermissions)
    ? adminPermissionOptions.map((permission) => permission.value)
    : access.adminPermissions;

  return NextResponse.json({
    ok: true,
    isMaster: isMasterAdmin(access.adminPermissions),
    permissions,
  });
}
