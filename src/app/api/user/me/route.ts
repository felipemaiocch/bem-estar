import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.sub },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        company: true,
        score: true,
      }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao buscar usuário" }, { status: 500 });
  }
}
