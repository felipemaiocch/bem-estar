import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildRankingEntry } from "@/lib/ranking-privacy";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const category = request.nextUrl.searchParams.get("category") ?? "Geral";

  try {
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
        showInRanking: true,
      },
      orderBy: [
        { score: "desc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
    });

    const rankedUsers = users.map((user, index) =>
      buildRankingEntry(user, index + 1, auth.session.sub),
    );
    const leaderboard = rankedUsers.slice(0, 5);
    const me = rankedUsers.find((user) => user.id === auth.session.sub) ?? null;

    return NextResponse.json({
      ok: true,
      category,
      leaderboard,
      me,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha de conexão com o banco de dados ao buscar o ranking.",
      },
      { status: 500 },
    );
  }
}
