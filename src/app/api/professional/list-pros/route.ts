import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireSession } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  try {
    const professionals = await prisma.user.findMany({
      where: {
        role: "PROFESSIONAL",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        professionalProfile: {
          select: {
            specialty: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      ok: true,
      professionals: professionals.map(p => ({
        id: p.id,
        name: p.name,
        specialty: p.professionalProfile?.specialty || "Profissional",
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao listar profissionais." }, { status: 500 });
  }
}
