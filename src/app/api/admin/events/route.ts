import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { createAdminEvent, listAdminEvents } from "@/lib/admin-operations";

const createEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(4000),
  location: z.string().min(2).max(200),
  category: z.string().min(2).max(120),
  kind: z.enum(["EVENT", "CULTURE", "PARTY"]),
  startsAtIso: z.string().min(5).max(40),
  endsAtIso: z.string().min(5).max(40),
  points: z.number().int().min(0).max(5000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELED"]).optional(),
  maxAttendees: z.number().int().min(1).max(50000).optional(),
  responsibleName: z.string().max(200).optional(),
  accessGroupId: z.string().optional().nullable().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const events = await listAdminEvents();

  return NextResponse.json({
    ok: true,
    events,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para criação de evento.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const startsAt = new Date(parsed.data.startsAtIso);
  const endsAt = new Date(parsed.data.endsAtIso);

  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    startsAt.getTime() >= endsAt.getTime()
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Datas inválidas para o evento.",
      },
      { status: 400 },
    );
  }

  try {
    const event = await createAdminEvent(auth.session.sub, {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      category: parsed.data.category,
      kind: parsed.data.kind,
      startsAt,
      endsAt,
      points: parsed.data.points,
      status: parsed.data.status,
      maxAttendees: parsed.data.maxAttendees,
      responsibleName: parsed.data.responsibleName,
      accessGroupId: parsed.data.accessGroupId || null,
      publishedBy: auth.session.sub,
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
            : "Não foi possível criar evento.",
      },
      { status: 409 },
    );
  }
}
