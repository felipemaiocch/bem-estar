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

  const { searchParams } = new URL(request.url);
  const rawCategory = searchParams.get("category");
  
  // Map category slug to real name
  const categoryMap: Record<string, string> = {
      "saude-bem-estar": "Saúde e bem-estar",
      "cultura": "Cultura",
      "agenda-dr": "Agenda dr"
  };

  const category = categoryMap[rawCategory || ""] || rawCategory;

  try {
    const userGroupIds = await getActiveUserGroupIds(auth.session.sub);
    const events = await prisma.event.findMany({
      where: { 
          status: "PUBLISHED",
          ...(category ? { category } : {})
      },
      orderBy: { startsAt: "asc" },
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
          description: lockedCopy?.description ?? event.description,
          location: lockedCopy?.location ?? event.location,
          category: event.category,
          kind: event.kind,
          startsAtIso: event.startsAt.toISOString(),
          endsAtIso: event.endsAt.toISOString(),
          points: accessState.isLocked ? 0 : event.points,
          status: lockedCopy?.status ?? event.status,
          responsibleName: accessState.isLocked ? null : event.responsibleName,
          accessGroupName: accessState.accessGroupName,
          isRestricted: accessState.isRestricted,
          userHasAccess: accessState.userHasAccess,
          isLocked: accessState.isLocked,
        };
      }),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Falha ao listar eventos" }, { status: 500 });
  }
}
