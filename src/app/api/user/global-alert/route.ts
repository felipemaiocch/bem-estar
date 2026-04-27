import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  // We require a USER session to see the alert, but NOT an ADMIN session.
  // This solves the 403 issue for standard users.
  const auth = await requireSession(request as any, "USER");
  if (auth.response) return auth.response;

  try {
    const alert = await prisma.globalAlert.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, alert });
  } catch (error) {
    return NextResponse.json({ ok: false, alert: null });
  }
}
