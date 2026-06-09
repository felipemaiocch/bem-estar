import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/admin-permissions";
import { getLibraryReport } from "@/lib/library";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const querySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

function parseDate(value?: string | null, endOfDay = false) {
  if (!value) return undefined;

  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, "LIBRARY");

  if (auth.response) {
    return auth.response;
  }

  const parsed = querySchema.safeParse({
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Periodo invalido para relatorio.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const from = parseDate(parsed.data.from);
  const to = parseDate(parsed.data.to, true);

  if (from && to && from > to) {
    return NextResponse.json(
      { ok: false, error: "A data inicial nao pode ser maior que a data final." },
      { status: 400 },
    );
  }

  const report = await getLibraryReport({ from, to });

  return NextResponse.json({
    ok: true,
    report,
  });
}
