import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getDepartmentLabel } from "@/lib/departments";

const moodColors: Record<string, string> = {
  "Sob pressão": "bg-rose-500",
  Cansado: "bg-amber-500",
  Equilibrado: "bg-blue-500",
  Energizado: "bg-emerald-500",
};

const moodOrder = ["Sob pressão", "Cansado", "Equilibrado", "Energizado"];

export async function GET(request: Request) {
  const auth = await requireSession(request as any, "ADMIN");
  if (auth.response) return auth.response;

  try {
    // Pegamos os check-ins das últimas 24 horas para ter um "Mapa de Calor" atual
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const checkIns = await prisma.wellnessEntry.findMany({
      where: {
        createdAt: { gte: yesterday }
      },
      select: {
        moodLabel: true,
        user: {
          select: {
            department: true,
          },
        },
      },
    });

    const total = checkIns.length || 1; // Evita divisão por zero
    
    // Contamos as ocorrências de cada humor
    const counts = {
      "Sob pressão": checkIns.filter((c) => c.moodLabel === "Sob pressão").length,
      "Cansado": checkIns.filter((c) => c.moodLabel === "Cansado").length,
      "Equilibrado": checkIns.filter((c) => c.moodLabel === "Equilibrado").length,
      "Energizado": checkIns.filter((c) => c.moodLabel === "Energizado").length,
    };

    // Calculamos as porcentagens para o gráfico
    const stats = [
      { area: "Sob pressão (Alerta)", risk: Math.round((counts["Sob pressão"] / total) * 100), color: moodColors["Sob pressão"] },
      { area: "Cansado (Atenção)", risk: Math.round((counts["Cansado"] / total) * 100), color: moodColors.Cansado },
      { area: "Equilibrado", risk: Math.round((counts["Equilibrado"] / total) * 100), color: moodColors.Equilibrado },
      { area: "Energizado", risk: Math.round((counts["Energizado"] / total) * 100), color: moodColors.Energizado },
    ];

    const departmentStats = Array.from(
      checkIns.reduce(
        (acc, checkIn) => {
          const department = checkIn.user.department ?? "SEM_DEPARTAMENTO";
          const current = acc.get(department) ?? {
            department,
            departmentLabel: getDepartmentLabel(checkIn.user.department),
            total: 0,
            counts: Object.fromEntries(moodOrder.map((mood) => [mood, 0])) as Record<string, number>,
          };

          current.total += 1;
          if (checkIn.moodLabel && current.counts[checkIn.moodLabel] !== undefined) {
            current.counts[checkIn.moodLabel] += 1;
          }
          acc.set(department, current);
          return acc;
        },
        new Map<
          string,
          {
            department: string;
            departmentLabel: string;
            total: number;
            counts: Record<string, number>;
          }
        >(),
      ).values(),
    )
      .map((department) => {
        const alertCount = department.counts["Sob pressão"] + department.counts.Cansado;
        const alertRisk = department.total > 0 ? Math.round((alertCount / department.total) * 100) : 0;
        const mainMood =
          moodOrder
            .map((mood) => ({ mood, count: department.counts[mood] ?? 0 }))
            .sort((left, right) => right.count - left.count)[0]?.mood ?? "Sem dados";

        return {
          department: department.department,
          departmentLabel: department.departmentLabel,
          total: department.total,
          alertRisk,
          mainMood,
          moods: moodOrder.map((mood) => ({
            mood,
            count: department.counts[mood] ?? 0,
            percent: department.total > 0 ? Math.round(((department.counts[mood] ?? 0) / department.total) * 100) : 0,
            color: moodColors[mood],
          })),
        };
      })
      .sort((left, right) => right.alertRisk - left.alertRisk || right.total - left.total);

    // Se não houver check-ins nas últimas 24h, retornamos um estado base equilibrado para o gráfico não sumir
    if (checkIns.length === 0) {
        return NextResponse.json({ 
            ok: true, 
            stats: [
                { area: "Sob pressão (Alerta)", risk: 0, color: "bg-rose-500" },
                { area: "Cansado (Atenção)", risk: 0, color: "bg-amber-500" },
                { area: "Equilibrado", risk: 100, color: "bg-blue-500" },
                { area: "Energizado", risk: 0, color: "bg-emerald-500" },
            ],
            departmentStats: [],
        });
    }

    return NextResponse.json({ ok: true, stats, departmentStats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Falha ao carregar métricas de humor" }, { status: 500 });
  }
}
