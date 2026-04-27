import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");
  if (auth.response) return auth.response;

  const config = await prisma.agendaSetting.findUnique({
    where: { id: "global-config" },
  });

  return NextResponse.json({
    ok: true,
    slots: config?.slots ?? "09:00, 10:00, 11:00, 14:00, 15:00, 16:00",
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");
  if (auth.response) return auth.response;

  try {
    const { slots } = await request.json();
    
    // Simple validation
    const slotsArray = slots.split(",").map((s: string) => s.trim()).filter((s: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(s));
    
    if (slotsArray.length === 0) {
       return NextResponse.json({ ok: false, error: "Horários inválidos. Use formato HH:MM separados por vírgula." }, { status: 400 });
    }

    const config = await prisma.agendaSetting.upsert({
      where: { id: "global-config" },
      update: { slots: slotsArray.join(", ") },
      create: { id: "global-config", slots: slotsArray.join(", ") },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao salvar configuração." }, { status: 500 });
  }
}
