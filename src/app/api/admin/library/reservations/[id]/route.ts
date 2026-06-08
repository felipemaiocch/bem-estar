import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { libraryReservationStatusValues } from "@/lib/library";
import { prisma } from "@/lib/prisma";

const updateReservationSchema = z.object({
  status: z.enum(libraryReservationStatusValues),
  notes: z.string().max(500).optional(),
});

function getReservationId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const reservationId = getReservationId(request.nextUrl.pathname);
  const body = await request.json();
  const parsed = updateReservationSchema.safeParse(body);

  if (!reservationId || !parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos para atualizar reserva.", issues: parsed.success ? undefined : parsed.error.flatten() },
      { status: 400 },
    );
  }

  const reservation = await prisma.libraryReservation.findUnique({
    where: { id: reservationId },
    select: { id: true, itemId: true, status: true },
  });

  if (!reservation) {
    return NextResponse.json({ ok: false, error: "Reserva não encontrada." }, { status: 404 });
  }

  const wasActive = ["RESERVED", "BORROWED", "OVERDUE"].includes(reservation.status);
  const willBeInactive = ["RETURNED", "CANCELED"].includes(parsed.data.status);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.libraryReservation.update({
      where: { id: reservationId },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes?.trim() || undefined,
        borrowedAt: parsed.data.status === "BORROWED" ? new Date() : undefined,
        returnedAt: parsed.data.status === "RETURNED" ? new Date() : undefined,
      },
      include: {
        item: true,
        user: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    if (wasActive && willBeInactive) {
      await tx.libraryItem.update({
        where: { id: reservation.itemId },
        data: { availableCopies: { increment: 1 } },
      });
    }

    return result;
  });

  return NextResponse.json({ ok: true, reservation: updated });
}
