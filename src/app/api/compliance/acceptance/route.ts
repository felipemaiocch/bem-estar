import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import {
  getAcceptanceStatus,
  recordRequiredAcceptances,
  requiredPlatformTerms,
} from "@/lib/compliance";

const acceptanceSchema = z.object({
  acceptPlatformTerms: z.boolean(),
  acceptImagePublication: z.boolean().default(false),
});

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(
    request,
    ["USER", "PROFESSIONAL", "ADMIN"],
    { requireAcceptedTerms: false },
  );

  if (auth.response) {
    return auth.response;
  }

  const status = await getAcceptanceStatus(auth.session.sub);

  return NextResponse.json({
    ok: true,
    requiredPlatformTerms,
    status,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(
    request,
    ["USER", "PROFESSIONAL", "ADMIN"],
    { requireAcceptedTerms: false },
  );

  if (auth.response) {
    return auth.response;
  }

  const parsed = acceptanceSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados de aceite inválidos.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (!parsed.data.acceptPlatformTerms) {
    return NextResponse.json(
      { ok: false, error: "O aceite do termo principal é obrigatório." },
      { status: 400 },
    );
  }

  const status = await recordRequiredAcceptances({
    userId: auth.session.sub,
    acceptPlatformTerms: parsed.data.acceptPlatformTerms,
    acceptImagePublication: parsed.data.acceptImagePublication,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    ok: true,
    requiredPlatformTerms,
    status,
  });
}
