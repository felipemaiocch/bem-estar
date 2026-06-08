import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { listAgendaSlots, listUserAgendaBookings } from "@/lib/agenda-bookings";
import { requireSession } from "@/lib/api-auth";

const monthQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  filter: z.string().optional(),
});

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = monthQuerySchema.safeParse({
    month: request.nextUrl.searchParams.get("month"),
    year: request.nextUrl.searchParams.get("year"),
    filter: request.nextUrl.searchParams.get("filter") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { month, year, filter } = parsed.data;
  const daysInMonth = new Date(year, month, 0).getDate();
  const session = {
    sub: auth.session.sub,
    email: auth.session.email,
  };

  const [days, bookings] = await Promise.all([
    Promise.all(
      Array.from({ length: daysInMonth }, async (_, index) => {
        const day = index + 1;
        const content = await listAgendaSlots({
          date: { day, month, year },
          filter,
          session,
        });

        return {
          day,
          dateKey: toDateKey(new Date(year, month - 1, day)),
          slotsCount: content.slots.length,
          availableSlotsCount: content.slots.filter((slot) => slot.status === "available").length,
          eventsCount: content.events.length,
          cardsCount: content.cards.length,
          labels: [
            ...content.events.slice(0, 2).map((event) => ({
              title: event.title,
              kind: "event" as const,
            })),
            ...content.cards.slice(0, 2).map((card) => ({
              title: card.title,
              kind: "card" as const,
            })),
          ].slice(0, 3),
        };
      }),
    ),
    listUserAgendaBookings({ session, onlyUpcoming: true }),
  ]);

  const bookingCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    const key = toDateKey(new Date(booking.startsAtIso));
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    ok: true,
    days: days.map((day) => ({
      ...day,
      myBookingsCount: bookingCounts[day.dateKey] ?? 0,
    })),
  });
}
