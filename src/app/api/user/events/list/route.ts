import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

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
    const events = await prisma.event.findMany({
      where: { 
          status: "PUBLISHED",
          ...(category ? { category } : {})
      },
      orderBy: { startsAt: "asc" },
    });

    return NextResponse.json({
      ok: true,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        category: e.category,
        kind: e.kind,
        startsAtIso: e.startsAt.toISOString(),
        endsAtIso: e.endsAt.toISOString(),
        points: e.points,
        status: e.status,
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Falha ao listar eventos" }, { status: 500 });
  }
}
