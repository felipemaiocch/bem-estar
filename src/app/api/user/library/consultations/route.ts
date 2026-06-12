import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { registerLibraryConsultation } from "@/lib/library";

const consultationSchema = z.object({
  itemId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = consultationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Consulta inválida.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await registerLibraryConsultation(auth.session.sub, parsed.data.itemId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Não foi possível registrar a consulta.",
      },
      { status: 409 },
    );
  }
}
