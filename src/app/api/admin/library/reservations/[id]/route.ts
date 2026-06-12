import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  borrowLibraryReservation,
  cancelLibraryReservation,
  libraryReservationStatusValues,
  renewLibraryReservation,
  returnLibraryReservation,
} from "@/lib/library";

const updateReservationSchema = z.object({
  status: z.union([z.enum(libraryReservationStatusValues), z.literal("RENEWED")]),
  notes: z.string().max(500).optional(),
});

function getReservationId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminPermission(request, "LIBRARY");

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

  try {
    const updated =
      parsed.data.status === "BORROWED"
        ? await borrowLibraryReservation(reservationId, parsed.data.notes)
        : parsed.data.status === "RETURNED"
          ? await returnLibraryReservation(reservationId, parsed.data.notes)
          : parsed.data.status === "CANCELED"
            ? await cancelLibraryReservation(reservationId, parsed.data.notes)
            : parsed.data.status === "RENEWED"
              ? await renewLibraryReservation(reservationId)
              : null;

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Ação não suportada para esta movimentação." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, reservation: updated });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Não foi possível atualizar a movimentação.",
      },
      { status: 409 },
    );
  }
}
