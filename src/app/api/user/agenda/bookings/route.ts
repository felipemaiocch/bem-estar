import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createAgendaBooking, listUserAgendaBookings } from "@/lib/agenda-bookings";
import { requireSession } from "@/lib/api-auth";

const bookingSchema = z.object({
  slotId: z.string().min(1),
  action: z.enum(["reserve", "waitlist"]),
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

const bookingQuerySchema = z.object({
  onlyUpcoming: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = bookingQuerySchema.safeParse({
    onlyUpcoming: request.nextUrl.searchParams.get("onlyUpcoming") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const bookings = await listUserAgendaBookings({
    session: {
      sub: auth.session.sub,
      email: auth.session.email,
    },
    onlyUpcoming: parsed.data.onlyUpcoming ?? true,
  });

  return NextResponse.json({
    ok: true,
    bookings,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await createAgendaBooking({
      action: parsed.data.action,
      slotId: parsed.data.slotId,
      date: {
        day: parsed.data.day,
        month: parsed.data.month,
        year: parsed.data.year,
      },
      session: {
        sub: auth.session.sub,
        email: auth.session.email,
      },
    });

    return NextResponse.json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a ação na agenda.",
      },
      { status: 409 },
    );
  }
}
