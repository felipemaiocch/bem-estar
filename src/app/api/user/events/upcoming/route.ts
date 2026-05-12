import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import {
  buildRestrictedContentState,
  getActiveUserGroupIds,
  lockedContentCopy,
} from "@/lib/group-content-access";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  try {
    const userGroupIds = await getActiveUserGroupIds(auth.session.sub);
    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        startsAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        startsAt: "asc", // nearest first
      },
      take: 5,
      include: {
        accessGroup: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      events: events.map((event) => {
        const accessState = buildRestrictedContentState(event, userGroupIds);
        const lockedCopy = accessState.isLocked ? lockedContentCopy(event) : null;

        return {
          id: event.id,
          title: lockedCopy?.title ?? event.title,
          location: lockedCopy?.location ?? event.location,
          startsAtIso: event.startsAt.toISOString(),
          points: accessState.isLocked ? 0 : event.points,
          accessGroupName: accessState.accessGroupName,
          isRestricted: accessState.isRestricted,
          userHasAccess: accessState.userHasAccess,
          isLocked: accessState.isLocked,
        };
      }),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha ao buscar eventos" }, { status: 500 });
  }
}
