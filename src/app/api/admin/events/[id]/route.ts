import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { updateAdminEvent } from "@/lib/admin-operations";

const updateEventSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(5).max(4000).optional(),
  location: z.string().min(2).max(200).optional(),
  category: z.string().min(2).max(120).optional(),
  kind: z.enum(["EVENT", "CULTURE", "PARTY"]).optional(),
  startsAtIso: z.string().min(5).max(40).optional(),
  endsAtIso: z.string().min(5).max(40).optional(),
  points: z.number().int().min(0).max(5000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELED"]).optional(),
  maxAttendees: z.number().int().min(1).max(50000).nullable().optional(),
  responsibleName: z.string().max(200).optional(),
  accessGroupId: z.string().optional().nullable().or(z.literal("")),
});

function getEventId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const eventId = getEventId(request.nextUrl.pathname);

  if (!eventId) {
    return NextResponse.json(
      { ok: false, error: "ID do evento não informado." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para atualizar evento.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const startsAt = parsed.data.startsAtIso ? new Date(parsed.data.startsAtIso) : undefined;
  const endsAt = parsed.data.endsAtIso ? new Date(parsed.data.endsAtIso) : undefined;

  if (
    (startsAt && Number.isNaN(startsAt.getTime())) ||
    (endsAt && Number.isNaN(endsAt.getTime())) ||
    (startsAt && endsAt && startsAt.getTime() >= endsAt.getTime())
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Datas inválidas para atualizar evento.",
      },
      { status: 400 },
    );
  }

  try {
    const event = await updateAdminEvent(auth.session.sub, eventId, {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      category: parsed.data.category,
      kind: parsed.data.kind,
      startsAt,
      endsAt,
      points: parsed.data.points,
      status: parsed.data.status,
      maxAttendees: parsed.data.maxAttendees ?? undefined,
      responsibleName: parsed.data.responsibleName,
      accessGroupId: parsed.data.accessGroupId === undefined ? undefined : parsed.data.accessGroupId || null,
    });

    return NextResponse.json({
      ok: true,
      event,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar evento.",
      },
      { status: 409 },
    );
  }
}
