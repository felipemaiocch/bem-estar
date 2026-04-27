import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { listProfessionalBookings } from "@/lib/agenda-bookings";
import { requireSession } from "@/lib/api-auth";

const bookingsQuerySchema = z.object({
  day: z.coerce.number().int().min(1).max(31).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const parsed = bookingsQuerySchema.safeParse({
    day: request.nextUrl.searchParams.get("day") ?? undefined,
    month: request.nextUrl.searchParams.get("month") ?? undefined,
    year: request.nextUrl.searchParams.get("year") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const hasDate =
    parsed.data.day !== undefined &&
    parsed.data.month !== undefined &&
    parsed.data.year !== undefined;

  if (
    (parsed.data.day !== undefined ||
      parsed.data.month !== undefined ||
      parsed.data.year !== undefined) &&
    !hasDate
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Para filtrar por data, envie day, month e year juntos.",
      },
      { status: 400 },
    );
  }

  const bookings = await listProfessionalBookings({
    session: {
      sub: auth.session.sub,
      email: auth.session.email,
    },
    date: hasDate
      ? {
          day: parsed.data.day!,
          month: parsed.data.month!,
          year: parsed.data.year!,
        }
      : undefined,
  });

  return NextResponse.json({
    ok: true,
    bookings,
  });
}
