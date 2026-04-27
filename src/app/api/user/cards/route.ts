import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
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

  const cards = await prisma.engagementCard.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, cards });
}
