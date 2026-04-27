import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  createAdminProfessional,
  listAdminProfessionals,
} from "@/lib/admin-operations";

const createProfessionalSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.email(),
  specialty: z.string().min(2).max(160),
  licenseCode: z.string().max(120).optional(),
  password: z.string().min(6).max(120).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const professionals = await listAdminProfessionals();

  return NextResponse.json({
    ok: true,
    professionals,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createProfessionalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para criação de profissional.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const professional = await createAdminProfessional(auth.session.sub, parsed.data);

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
            : "Não foi possível criar profissional.",
      },
      { status: 409 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");
  if (auth.response) return auth.response;

  const body = await request.json();
  const { id, name, specialty, licenseCode } = body;

  try {
    const prof = await prisma.professionalProfile.update({
      where: { id },
      data: {
        specialty,
        licenseCode: licenseCode || null,
        user: {
          update: {
            name,
          }
        }
      }
    });

    return NextResponse.json({ ok: true, professional: prof });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Falha ao atualizar profissional." }, { status: 500 });
  }
}
