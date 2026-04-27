import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { updateAdminProfessional } from "@/lib/admin-operations";

const updateProfessionalSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  email: z.email().optional(),
  specialty: z.string().min(2).max(160).optional(),
  licenseCode: z.string().max(120).optional(),
  attendanceRate: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
});

function getProfessionalId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const professionalId = getProfessionalId(request.nextUrl.pathname);

  if (!professionalId) {
    return NextResponse.json(
      { ok: false, error: "ID do profissional não informado." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = updateProfessionalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para atualizar profissional.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const professional = await updateAdminProfessional(
      auth.session.sub,
      professionalId,
      parsed.data,
    );

    return NextResponse.json({
      ok: true,
      professional,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar profissional.",
      },
      { status: 409 },
    );
  }
}
