import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { createScoringRule, listScoringRules } from "@/lib/admin-gamification";

const createScoringRuleSchema = z.object({
  name: z.string().min(2).max(120),
  action: z.enum(["SESSION", "EVENT", "CHECKIN", "STREAK", "FEED_ENGAGEMENT", "TESTIMONIAL"]),
  points: z.number().int(),
  isActive: z.boolean().optional(),
  startsAtIso: z.string().datetime().optional().nullable(),
  endsAtIso: z.string().datetime().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const rules = await listScoringRules();

  return NextResponse.json({
    ok: true,
    rules,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createScoringRuleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para criação de regra de pontuação.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const data = {
      name: parsed.data.name,
      action: parsed.data.action,
      points: parsed.data.points,
      isActive: parsed.data.isActive,
      startsAt: parsed.data.startsAtIso ? new Date(parsed.data.startsAtIso) : undefined,
      endsAt: parsed.data.endsAtIso ? new Date(parsed.data.endsAtIso) : undefined,
    };

    const rule = await createScoringRule(auth.session.sub, data);

    return NextResponse.json({
      ok: true,
      rule,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível criar regra de pontuação.",
      },
      { status: 409 },
    );
  }
}
