import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  try {
    const { actionId, points } = await request.json() as { actionId: string, points: number };
    
    if (!actionId || !points) {
        return NextResponse.json({ ok: false, error: "Parâmetros faltando" }, { status: 400 });
    }

    const { sub } = auth.session;

    // Conceder pontuação
    const updatedUser = await prisma.user.update({
      where: { id: sub },
      data: { score: { increment: points } },
    });

    // Auditoria opcional para a gamificação
    await prisma.auditLog.create({
        data: {
            actorId: sub,
            action: "COMPLETED_MISSION",
            entity: "GAMIFICATION",
            entityId: actionId,
            metadata: {
                pointsAwarded: points,
                newScore: updatedUser.score,
            } as never
        }
    });

    return NextResponse.json({
      ok: true,
      newScore: updatedUser.score,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao completar missão" }, { status: 500 });
  }
}
