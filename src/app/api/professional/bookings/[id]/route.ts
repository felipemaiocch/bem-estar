import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { updateProfessionalBooking } from "@/lib/agenda-bookings";
import { requireSession } from "@/lib/api-auth";

const bookingUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "WAITLIST", "COMPLETED", "MISSED", "CANCELED"]),
  notes: z.string().max(3000).optional(),
  cancellationReason: z.string().max(1000).optional(),
});

function getBookingId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const bookingId = getBookingId(request.nextUrl.pathname);

  if (!bookingId) {
    return NextResponse.json(
      { ok: false, error: "ID do agendamento não informado." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = bookingUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const booking = await updateProfessionalBooking({
      session: {
        sub: auth.session.sub,
        email: auth.session.email,
      },
      bookingId,
      status: parsed.data.status,
      notes: parsed.data.notes,
      cancellationReason: parsed.data.cancellationReason,
    });

    return NextResponse.json({
      ok: true,
      booking,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o agendamento.",
      },
      { status: 409 },
    );
  }
}
