import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { z } from "zod";

const moderationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = moderationQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Parâmetros inválidos." }, { status: 400 });
    }

    const posts = await prisma.feedPost.findMany({
      take: parsed.data.limit,
      skip: parsed.data.offset,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
      }
    });

    return NextResponse.json({ ok: true, posts });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao listar posts." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession(request, "ADMIN");
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ ok: false, error: "ID não informado." }, { status: 400 });

    await prisma.feedPost.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao excluir post." }, { status: 500 });
  }
}
