import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { createWellnessEntry, listWellnessEntries } from "@/lib/wellness";

const createWellnessSchema = z.object({
  weightKg: z.number().min(20).max(500).optional(),
  moodLabel: z.string().min(2).max(80).optional(),
  notes: z.string().max(4000).optional(),
  habitsScore: z.number().int().min(0).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const entries = await listWellnessEntries(auth.session.sub);

  return NextResponse.json({
    ok: true,
    entries,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createWellnessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para salvar evolução.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const entry = await createWellnessEntry(auth.session.sub, parsed.data);

    return NextResponse.json({
      ok: true,
      entry,
      pointsAwarded: 5,
      message: "Check-in salvo. +5 pontos adicionados ao seu ranking.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar check-in.",
      },
      { status: 409 },
    );
  }
}
