import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { createFeedComment } from "@/lib/feed";

const commentBodySchema = z.object({
  text: z.string().min(1).max(1000),
});

function getPostId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const postIndex = segments.findIndex((segment) => segment === "posts");

  if (postIndex < 0) {
    return "";
  }

  return segments[postIndex + 1] ?? "";
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  const postId = getPostId(request.nextUrl.pathname);

  if (!postId) {
    return NextResponse.json(
      { ok: false, error: "Post não informado." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = commentBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Comentário inválido.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const post = await createFeedComment(auth.session.sub, postId, parsed.data.text);

    return NextResponse.json({
      ok: true,
      post,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao comentar no post.",
      },
      { status: 404 },
    );
  }
}
