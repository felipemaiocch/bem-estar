import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/admin-permissions";
import { adminPermissionValues } from "@/lib/admin-permission-options";
import { updateAdminUser } from "@/lib/admin-operations";
import { departmentValues } from "@/lib/departments";

const updateUserSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  email: z.email().optional(),
  role: z.enum(["USER", "PROFESSIONAL", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  approvalNote: z.string().max(500).optional(),
  company: z.string().max(160).optional(),
  department: z.enum(departmentValues).nullable().optional(),
  score: z.number().int().min(0).max(100000).optional(),
  groupIds: z.array(z.string().min(1)).optional(),
  adminPermissions: z.array(z.enum(adminPermissionValues)).optional(),
});

function getUserId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminPermission(request, "USERS");

  if (auth.response) {
    return auth.response;
  }

  const userId = getUserId(request.nextUrl.pathname);

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "ID do usuário não informado." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para atualizar usuário.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const user = await updateAdminUser(auth.session.sub, userId, parsed.data);

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar usuário.",
      },
      { status: 409 },
    );
  }
}
