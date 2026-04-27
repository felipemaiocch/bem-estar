import { NextResponse, type NextRequest } from "next/server";

import { listCareRecordsForUser } from "@/lib/care-records";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const [records, user] = await Promise.all([
    listCareRecordsForUser(auth.session.sub),
    prisma.user.findUnique({
      where: { id: auth.session.sub },
      select: { name: true, score: true, company: true }
    })
  ]);

  return NextResponse.json({
    ok: true,
    records,
    user: user ? {
      name: user.name,
      score: user.score,
      area: user.company || "Geral"
    } : null
  });
}
