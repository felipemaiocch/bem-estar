import { NextResponse, type NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const { sub } = auth.session;

  try {
    // 1. Leaderboard
    const topUsers = await prisma.user.findMany({
      where: { role: "USER", isActive: true },
      select: { id: true, name: true, company: true, score: true },
      orderBy: { score: "desc" },
      take: 5,
    });
    
    // 2. Upcoming events (Categorized)
    const upcomingEvents = await prisma.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 4,
    });

    // 3. User Engagement Metrics
    // Quantos agendamentos esse usuario tem (Saude e bem-estar)
    const bookingsCount = await prisma.sessionBooking.count({
        where: { userId: sub, startsAt: { gte: new Date() } }
    });
    
    // Contagem global de eventos publicados para os cards da home
    const totalCultureEvents = await prisma.event.count({
        where: { status: "PUBLISHED", category: "Cultura" }
    });

    const totalAgendaEvents = await prisma.event.count({
        where: { status: "PUBLISHED", category: "Agenda dr" }
    });

    return NextResponse.json({
      ok: true,
      leaderboard: topUsers.map(u => ({
          name: u.name,
          area: u.company || "Geral",
          points: u.score,
      })),
      upcomingEvents: upcomingEvents.map(e => ({
          id: e.id,
          title: e.title,
          location: e.location,
          category: e.category,
          startsAtIso: e.startsAt.toISOString(),
      })),
      metrics: {
          bookingsCount,
          cultureCount: totalCultureEvents,
          agendaCount: totalAgendaEvents
      }
    });

  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao buscar resumo" }, { status: 500 });
  }
}
