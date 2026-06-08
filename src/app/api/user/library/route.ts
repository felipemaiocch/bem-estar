import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { libraryKindValues, listLibraryForUser } from "@/lib/library";

const querySchema = z.object({
  search: z.string().max(120).optional(),
  kind: z.union([z.enum(libraryKindValues), z.literal("ALL")]).optional(),
  category: z.string().max(120).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = querySchema.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    kind: request.nextUrl.searchParams.get("kind") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Filtros inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await listLibraryForUser(auth.session.sub, parsed.data);

  return NextResponse.json({
    ok: true,
    ...data,
  });
}
