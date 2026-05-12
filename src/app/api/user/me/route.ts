import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const profilePrivacySchema = z.object({
  showInRanking: z.boolean(),
});

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
        showInRanking: true,
      }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha ao buscar usuário" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = profilePrivacySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados de privacidade inválidos.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: auth.session.sub },
      data: { showInRanking: parsed.data.showInRanking },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        company: true,
        score: true,
        showInRanking: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Falha ao atualizar privacidade do ranking." },
      { status: 500 },
    );
  }
}
