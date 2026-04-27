import { NextResponse, type NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const globalAlertSchema = z.object({
  message: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = globalAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Mensagem inválida." },
        { status: 400 }
      );
    }

    // Inactivate previous alerts
    await prisma.globalAlert.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new alert
    const alert = await prisma.globalAlert.create({
      data: {
        message: parsed.data.message,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, alert });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Erro ao salvar comunicado." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const alert = await prisma.globalAlert.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, alert });
  } catch (error) {
    return NextResponse.json({ ok: false, alert: null });
  }
}
