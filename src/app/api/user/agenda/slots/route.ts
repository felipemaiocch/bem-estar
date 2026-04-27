import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { listAgendaSlots } from "@/lib/agenda-bookings";
import { requireSession } from "@/lib/api-auth";

const slotQuerySchema = z.object({
  day: z.coerce.number().int().min(1).max(31),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  filter: z.string().optional(),
  focus: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = slotQuerySchema.safeParse({
    day: request.nextUrl.searchParams.get("day"),
    month: request.nextUrl.searchParams.get("month"),
    year: request.nextUrl.searchParams.get("year"),
    filter: request.nextUrl.searchParams.get("filter") ?? undefined,
    focus: request.nextUrl.searchParams.get("focus") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const slots = await listAgendaSlots({
    date: {
      day: parsed.data.day,
      month: parsed.data.month,
      year: parsed.data.year,
    },
    filter: parsed.data.filter,
    focusFilter: parsed.data.focus,
    session: {
      sub: auth.session.sub,
      email: auth.session.email,
    },
  });

  return NextResponse.json({
    ok: true,
    slots,
  });
}
