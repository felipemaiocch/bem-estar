import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  createCareRecord,
  listCareRecordsByProfessional,
  listCareRecordsForPatient,
  listMonitoredUsers,
} from "@/lib/care-records";
import { requireSession } from "@/lib/api-auth";

const careRecordBodySchema = z.object({
  userId: z.string().min(1),
  category: z.enum(["psicologia", "fisioterapia", "nutricao", "enfermagem", "geral"]).default("geral"),
  professionalRole: z.string().min(2).max(120).optional(),
  sourceType: z.enum(["manual", "appointment", "event", "ead", "checkin", "library"]).default("manual"),
  sourceId: z.string().nullable().optional(),
  visibility: z.enum(["user_visible", "team_only", "admin_only", "family_visible"]).default("user_visible"),
  priority: z.enum(["low", "normal", "attention", "critical"]).default("normal"),
  requiresFollowUp: z.boolean().default(false),
  followUpStatus: z.enum(["open", "in_progress", "resolved"]).default("open"),
  title: z.string().min(2).max(180),
  summary: z.string().min(5).max(4000),
  delivery: z.string().min(5).max(4000),
  nextStep: z.string().max(1000).optional(),
  metrics: z
    .array(
      z.object({
        label: z.string().max(120),
        value: z.string().max(240),
      }),
    )
    .default([]),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;

  const [records, users] = await Promise.all([
    userId
      ? listCareRecordsForPatient(auth.session.sub, userId)
      : listCareRecordsByProfessional(auth.session.sub),
    listMonitoredUsers(),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    users,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = careRecordBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await createCareRecord({
      userId: parsed.data.userId,
      professionalUserId: auth.session.sub,
      professionalName: auth.session.name,
      professionalRole: parsed.data.professionalRole,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      visibility: parsed.data.visibility,
      priority: parsed.data.priority,
      requiresFollowUp: parsed.data.requiresFollowUp,
      followUpStatus: parsed.data.followUpStatus,
      category: parsed.data.category || "geral",
      title: parsed.data.title,
      summary: parsed.data.summary,
      delivery: parsed.data.delivery,
      nextStep: parsed.data.nextStep,
      metrics: parsed.data.metrics,
    });

    return NextResponse.json({
      ok: true,
      record,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o registro.",
      },
      { status: 409 },
    );
  }
}
