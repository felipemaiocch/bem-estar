import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { createAdminGroup, listAdminGroups } from "@/lib/admin-operations";

const createGroupSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160).optional(),
  description: z.string().max(500).optional(),
  kind: z.enum(["COHORT", "CLASS", "TAG", "PROJECT"]).optional(),
  isRestricted: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const groups = await listAdminGroups();

  return NextResponse.json({
    ok: true,
    groups,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para criação de grupo.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const group = await createAdminGroup(auth.session.sub, parsed.data);

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
            : "Não foi possível criar grupo.",
      },
      { status: 409 },
    );
  }
}
