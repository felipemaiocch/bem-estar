import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { listFeedPosts } from "@/lib/feed";

const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const parsed = feedQuerySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    offset: request.nextUrl.searchParams.get("offset") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Parâmetros inválidos para carregar feed.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = await listFeedPosts(auth.session.sub, {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return NextResponse.json({
      ok: true,
      posts: result.posts,
      hasMore: result.hasMore,
      nextOffset: result.nextOffset,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o feed.",
      },
      { status: 500 },
    );
  }
}
