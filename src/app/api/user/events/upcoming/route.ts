import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  try {
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
    });

    return NextResponse.json({
      ok: true,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        location: e.location,
        startsAtIso: e.startsAt.toISOString(),
        points: e.points,
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao buscar eventos" }, { status: 500 });
  }
}
