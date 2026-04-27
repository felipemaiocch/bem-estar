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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = await prisma.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gte: today } },
      orderBy: { startsAt: "asc" },
      take: 4,
    });

    const latestCards = await prisma.engagementCard.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
    });

    // 3. User Engagement Metrics
    // Quantos agendamentos esse usuario tem (Saude e bem-estar)
    const bookingsCount = await prisma.sessionBooking.count({
        where: { userId: sub, startsAt: { gte: new Date() } }
    });
    
    // Contagem global de conteúdos e eventos publicados para os cards da home
    const [
        totalCultureEvents, totalCultureCards,
        totalAgendaEvents, totalAgendaCards,
        totalHealthCards
    ] = await Promise.all([
        prisma.event.count({ where: { status: "PUBLISHED", category: "Cultura" } }),
        prisma.engagementCard.count({ where: { category: "cultura" } }),
        prisma.event.count({ where: { status: "PUBLISHED", category: "Agenda dr" } }),
        prisma.engagementCard.count({ where: { category: "agenda-dr" } }),
        prisma.engagementCard.count({ where: { category: "saude-bem-estar" } }),
    ]);

    const upcomingEventsData = upcomingEvents.map(e => ({
        id: e.id,
        title: e.title,
        location: e.location,
        category: e.category,
        startsAtIso: e.startsAt.toISOString(),
        isCard: false,
    }));

    const latestCardsData = latestCards.map(c => {
        // Se o card tem uma data fixa no banco, tentar usar ela
        let cardDate = c.createdAt;
        if (c.date && c.date.length > 5 && !isNaN(Date.parse(c.date))) {
          cardDate = new Date(c.date);
        }

        return {
          id: c.id,
          title: c.title,
          location: c.location,
          category: c.category.replace('saude-bem-estar', 'Saúde').replace('cultura', 'Cultura'),
          startsAtIso: cardDate.toISOString(),
          isCard: true,
          cardDisplayDate: c.date // Enviamos a string original para o front decidir se mostra fixo ou recorrente
        };
    });

    const unifiedEvents = [...upcomingEventsData, ...latestCardsData]
        .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())
        .slice(0, 5);

    return NextResponse.json({
      ok: true,
      leaderboard: topUsers.map(u => ({
          name: u.name,
          area: u.company || "Geral",
          points: u.score,
      })),
      upcomingEvents: unifiedEvents,
      metrics: {
          bookingsCount,
          cultureCount: totalCultureEvents + totalCultureCards,
          agendaCount: totalAgendaEvents + totalAgendaCards,
          healthCount: totalHealthCards
      }
    });

  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao buscar resumo" }, { status: 500 });
  }
}
