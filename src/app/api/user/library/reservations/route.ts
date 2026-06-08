import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { reserveLibraryItem } from "@/lib/library";

const reservationSchema = z.object({
  itemId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = reservationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Reserva inválida.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const reservation = await reserveLibraryItem(auth.session.sub, parsed.data.itemId);

    return NextResponse.json({
      ok: true,
      reservation,
      message: "Reserva criada. Retire o material na biblioteca da empresa.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível reservar este material.",
      },
      { status: 409 },
    );
  }
}
