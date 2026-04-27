import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireSession(request as any, "ADMIN");
  if (auth.response) return auth.response;

  try {
    // Pegamos os check-ins das últimas 24 horas para ter um "Mapa de Calor" atual
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const checkIns = await prisma.wellnessCheckIn.findMany({
      where: {
        recordedAt: { gte: yesterday }
      },
      select: { moodLabel: true }
    });

    const total = checkIns.length || 1; // Evita divisão por zero
    
    // Contamos as ocorrências de cada humor
    const counts = {
      "Sob pressão": checkIns.filter(c => c.moodLabel === "Sob pressão").length,
      "Cansado": checkIns.filter(c => c.moodLabel === "Cansado").length,
      "Equilibrado": checkIns.filter(c => c.moodLabel === "Equilibrado").length,
      "Energizado": checkIns.filter(c => c.moodLabel === "Energizado").length,
    };

    // Calculamos as porcentagens para o gráfico
    const stats = [
      { area: "Sob pressão (Alerta)", risk: Math.round((counts["Sob pressão"] / total) * 100), color: "bg-rose-500" },
      { area: "Cansado (Atenção)", risk: Math.round((counts["Cansado"] / total) * 100), color: "bg-amber-500" },
      { area: "Equilibrado", risk: Math.round((counts["Equilibrado"] / total) * 100), color: "bg-blue-500" },
      { area: "Energizado", risk: Math.round((counts["Energizado"] / total) * 100), color: "bg-emerald-500" },
    ];

    // Se não houver check-ins nas últimas 24h, retornamos um estado base equilibrado para o gráfico não sumir
    if (checkIns.length === 0) {
        return NextResponse.json({ 
            ok: true, 
            stats: [
                { area: "Sob pressão (Alerta)", risk: 0, color: "bg-rose-500" },
                { area: "Cansado (Atenção)", risk: 0, color: "bg-amber-500" },
                { area: "Equilibrado", risk: 100, color: "bg-blue-500" },
                { area: "Energizado", risk: 0, color: "bg-emerald-500" },
            ]
        });
    }

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Falha ao carregar métricas de humor" }, { status: 500 });
  }
}
