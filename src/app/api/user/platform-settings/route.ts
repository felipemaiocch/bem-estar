import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
