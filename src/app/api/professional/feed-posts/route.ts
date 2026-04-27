import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { createFeedPost, listFeedPosts } from "@/lib/feed";

const createFeedPostSchema = z.object({
  activity: z.string().min(2).max(180),
  caption: z.string().min(5).max(4000),
  location: z.string().max(180).optional(),
  imageUrl: z.url().optional(),
  professionalRole: z.string().min(2).max(120).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const result = await listFeedPosts(auth.session.sub, { limit: 20, offset: 0 });

  return NextResponse.json({
    ok: true,
    posts: result.posts,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createFeedPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados inválidos para publicação.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const post = await createFeedPost({
      authorId: auth.session.sub,
      professionalRole: parsed.data.professionalRole ?? "Profissional",
      activity: parsed.data.activity,
      location: parsed.data.location,
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption,
      status: "PUBLISHED",
    });

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
            : "Não foi possível publicar no feed.",
      },
      { status: 409 },
    );
  }
}
