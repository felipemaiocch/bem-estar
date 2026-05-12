import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/api-auth";
import {
  buildRestrictedContentState,
  getActiveUserGroupIds,
  lockedContentCopy,
} from "@/lib/group-content-access";
import { prisma } from "@/lib/prisma";
import { buildRankingEntry } from "@/lib/ranking-privacy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const { sub } = auth.session;

  try {
    const userGroupIds = await getActiveUserGroupIds(sub);
    // 1. Leaderboard
    const topUsers = await prisma.user.findMany({
      where: { role: "USER", isActive: true },
      select: { id: true, name: true, company: true, score: true, showInRanking: true },
      orderBy: [
        { score: "desc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      take: 5,
    });
    
    // 2. Upcoming events (Categorized)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = await prisma.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gte: today } },
      orderBy: { startsAt: "asc" },
      take: 4,
      include: {
        accessGroup: {
          select: { id: true, name: true },
        },
      },
    });

    const latestCards = await prisma.engagementCard.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          accessGroup: {
            select: { id: true, name: true },
          },
          responsible: {
            include: { user: { select: { name: true } } }
          }
        }
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

    const upcomingEventsData = upcomingEvents.map((event) => {
        const accessState = buildRestrictedContentState(event, userGroupIds);
        const lockedCopy = accessState.isLocked ? lockedContentCopy(event) : null;

        return {
          id: event.id,
          title: lockedCopy?.title ?? event.title,
          location: lockedCopy?.location ?? event.location,
          category: event.category,
          startsAtIso: event.startsAt.toISOString(),
          isCard: false,
          specialist: accessState.isLocked ? null : event.responsibleName || null,
          accessGroupName: accessState.accessGroupName,
          isRestricted: accessState.isRestricted,
          userHasAccess: accessState.userHasAccess,
          isLocked: accessState.isLocked,
        };
    });

    const latestCardsData = latestCards.map(c => {
        const accessState = buildRestrictedContentState(c, userGroupIds);
        const lockedCopy = accessState.isLocked ? lockedContentCopy(c) : null;
        // Se o card tem uma data fixa no banco, tentar usar ela
        let cardDate = c.createdAt;
        if (c.date && c.date.length >= 10 && !isNaN(Date.parse(c.date))) {
          // Add T12:00:00 to avoid timezone offset issues (e.g. 00:00 UTC showing as previous day)
          const dateStr = c.date.includes('T') ? c.date : `${c.date}T12:00:00`;
          cardDate = new Date(dateStr);
        }

        return {
          id: c.id,
          title: lockedCopy?.title ?? c.title,
          location: lockedCopy?.location ?? c.location,
          category: c.category.replace('saude-bem-estar', 'Saúde').replace('cultura', 'Cultura'),
          startsAtIso: cardDate.toISOString(),
          isCard: true,
          cardDisplayDate: accessState.isLocked ? lockedCopy?.status : c.date,
          specialist: accessState.isLocked ? null : c.responsibleName || c.responsible?.user.name || null,
          accessGroupName: accessState.accessGroupName,
          isRestricted: accessState.isRestricted,
          userHasAccess: accessState.userHasAccess,
          isLocked: accessState.isLocked,
        };
    });

    const unifiedEvents = [...upcomingEventsData, ...latestCardsData]
        .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())
        .slice(0, 5);

    return NextResponse.json({
      ok: true,
      leaderboard: topUsers.map((user, index) =>
        buildRankingEntry(user, index + 1, sub),
      ),
      upcomingEvents: unifiedEvents,
      metrics: {
          bookingsCount,
          cultureCount: totalCultureEvents + totalCultureCards,
          agendaCount: totalAgendaEvents + totalAgendaCards,
          healthCount: totalHealthCards
      }
    });

  } catch {
    return NextResponse.json({ ok: false, error: "Falha ao buscar resumo" }, { status: 500 });
  }
}
