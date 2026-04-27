import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { updateScoringRule } from "@/lib/admin-gamification";

const updateScoringRuleSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  points: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAtIso: z.string().datetime().optional().nullable(),
  endsAtIso: z.string().datetime().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const resolvedParams = await params;
  const ruleId = resolvedParams.id;
  const body = await request.json();
  const parsed = updateScoringRuleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para atualização de regra.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const data = {
      name: parsed.data.name,
      points: parsed.data.points,
      isActive: parsed.data.isActive,
      startsAt: parsed.data.startsAtIso === null ? null : parsed.data.startsAtIso ? new Date(parsed.data.startsAtIso) : undefined,
      endsAt: parsed.data.endsAtIso === null ? null : parsed.data.endsAtIso ? new Date(parsed.data.endsAtIso) : undefined,
    };

    const rule = await updateScoringRule(auth.session.sub, ruleId, data);

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
            : "Não foi possível atualizar a regra.",
      },
      { status: 409 },
    );
  }
}
