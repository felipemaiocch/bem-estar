import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { updateAdminGroup } from "@/lib/admin-operations";

const updateGroupSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  slug: z.string().min(2).max(160).optional(),
  description: z.string().max(500).nullable().optional(),
  kind: z.enum(["COHORT", "CLASS", "TAG", "PROJECT"]).optional(),
  isRestricted: z.boolean().optional(),
  isActive: z.boolean().optional(),
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
  const body = await request.json();
  const parsed = updateGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para atualizar grupo.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const group = await updateAdminGroup(auth.session.sub, resolvedParams.id, parsed.data);

    return NextResponse.json({
      ok: true,
      group,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar grupo.",
      },
      { status: 409 },
    );
  }
}
