import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";


export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const category = request.nextUrl.searchParams.get("category") ?? "Geral";



  try {
    // Na vida real, o cálculo de categoria pode exigir queries mais complexas
    // Para a Fase 1, listamos os usuários pelo seu score global.
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        company: true,
        score: true,
      },
      orderBy: {
        score: "desc",
      },
      take: 50,
    });

    const leaderboard = users.map((user, index) => {
      // Calculo simples de delta apenas ilustrativo (pode ser evoluído depois)
      const mockDelta = index % 2 === 0 ? "+2%" : "-1%";
      return {
        id: user.id,
        name: user.name,
        area: user.company || "Geral",
        points: user.score,
        delta: category === "Geral" ? "+0%" : mockDelta,
        isMe: user.id === auth.session.sub,
      };
    });

    const me = leaderboard.find((u) => u.id === auth.session.sub);
    const myPosition = me ? leaderboard.findIndex((u) => u.id === auth.session.sub) + 1 : null;

    return NextResponse.json({
      ok: true,
      leaderboard,
      me: {
        position: myPosition,
        points: me?.points ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha de conexão com o banco de dados ao buscar o ranking.",
      },
      { status: 500 }
    );
  }
}
