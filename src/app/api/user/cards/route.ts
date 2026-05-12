import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import {
  buildRestrictedContentState,
  getActiveUserGroupIds,
  lockedContentCopy,
} from "@/lib/group-content-access";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const category = request.nextUrl.searchParams.get("category");

  if (!category) {
    return NextResponse.json({ ok: false, error: "Categoria não informada" }, { status: 400 });
  }

  const userGroupIds = await getActiveUserGroupIds(auth.session.sub);

  const cards = await prisma.engagementCard.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    include: {
      accessGroup: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    cards: cards.map((card) => {
      const accessState = buildRestrictedContentState(card, userGroupIds);
      const lockedCopy = accessState.isLocked ? lockedContentCopy(card) : null;

      return {
        ...card,
        title: lockedCopy?.title ?? card.title,
        location: lockedCopy?.location ?? card.location,
        status: lockedCopy?.status ?? card.status,
        points: accessState.isLocked ? 0 : card.points,
        imageUrl: accessState.isLocked ? null : card.imageUrl,
        responsibleName: accessState.isLocked ? null : card.responsibleName,
        responsibleId: accessState.isLocked ? null : card.responsibleId,
        slots: accessState.isLocked ? null : card.slots,
        availableDays: accessState.isLocked ? null : card.availableDays,
        accessGroupName: accessState.accessGroupName,
        isRestricted: accessState.isRestricted,
        userHasAccess: accessState.userHasAccess,
        isLocked: accessState.isLocked,
        accessGroup: undefined,
      };
    }),
  });
}
