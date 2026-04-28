import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/api-auth";
import { listFeedPosts } from "@/lib/feed";
import { prisma } from "@/lib/prisma";

const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
  offset: z.coerce.number().int().min(0).default(0),
});

const createFeedPostSchema = z.object({
  activity: z.string().min(2).max(180),
  caption: z.string().min(5).max(4000),
  location: z.string().max(180).optional(),
  imageUrl: z.string().optional(),
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

    // Enriquecer com isOwner se o autor for o usuário atual
    const postsWithOwner = await Promise.all(result.posts.map(async (p) => {
      const dbPost = await prisma.feedPost.findUnique({
        where: { id: p.id },
        select: { authorId: true }
      });
      return {
        ...p,
        isOwner: dbPost?.authorId === auth.session.sub
      };
    }));

    return NextResponse.json({
      ok: true,
      posts: postsWithOwner,
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

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  try {
    // Verificar se a postagem está habilitada globalmente
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "global-settings" }
    });

    if (settings && !settings.allowUserPosting) {
      return NextResponse.json(
        { ok: false, error: "A publicação no feed está temporariamente desativada pela administração." },
        { status: 403 }
      );
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

    const { createFeedPost } = await import("@/lib/feed");
    const post = await createFeedPost({
      authorId: auth.session.sub,
      professionalRole: "Usuário",
      activity: parsed.data.activity,
      location: parsed.data.location,
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption,
      status: "PUBLISHED",
    });

    return NextResponse.json({
      ok: true,
      post: { ...post, isOwner: true },
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
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "USER");
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { id, activity, caption, location, imageUrl } = body;

    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post || post.authorId !== auth.session.sub) {
      return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 403 });
    }

    const updated = await prisma.feedPost.update({
      where: { id },
      data: {
        activity,
        caption,
        location: location || null,
        imageUrl: imageUrl || null,
      },
      include: {
        author: { select: { id: true, name: true } },
        likes: { select: { userId: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    const { formatWhen } = await import("@/lib/feed");
    return NextResponse.json({
      ok: true,
      post: {
        id: updated.id,
        professional: updated.author.name,
        professionalRole: updated.professionalRole ?? "Usuário",
        activity: updated.activity,
        time: formatWhen(updated.createdAt),
        location: updated.location ?? "se.monitora",
        image: updated.imageUrl ?? "",
        caption: updated.caption,
        likes: updated.likes.length,
        likedByUser: updated.likes.some(l => l.userId === auth.session.sub),
        isOwner: true,
        comments: updated.comments.map(c => ({ id: c.id, author: c.author.name, text: c.text }))
      }
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Erro ao atualizar post." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession(request, "USER");
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ ok: false, error: "ID não informado." }, { status: 400 });

    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post || post.authorId !== auth.session.sub) {
      return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 403 });
    }

    await prisma.feedPost.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Erro ao excluir post." }, { status: 500 });
  }
}
