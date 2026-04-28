import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const settings = await prisma.platformSettings.upsert({
      where: { id: "global-settings" },
      update: {},
      create: { allowUserPosting: true },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao carregar configurações." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { allowUserPosting } = body;

    const settings = await prisma.platformSettings.update({
      where: { id: "global-settings" },
      data: { allowUserPosting },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao atualizar configurações." }, { status: 500 });
  }
}
