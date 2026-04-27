import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { toggleFeedLike } from "@/lib/feed";

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

  try {
    const post = await toggleFeedLike(auth.session.sub, postId);

    return NextResponse.json({
      ok: true,
      post,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao curtir post.",
      },
      { status: 404 },
    );
  }
}
