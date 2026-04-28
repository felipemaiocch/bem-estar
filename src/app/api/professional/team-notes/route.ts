import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireSession } from "@/lib/api-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Paciente não especificado." }, { status: 400 });
  }

  try {
    const notes = await prisma.teamNote.findMany({
      where: { userId },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedNotes = notes.map((n) => ({
      id: n.id,
      author: n.author.name,
      authorRole: n.authorRole,
      content: n.content,
      targetCategory: n.targetCategory,
      createdAt: n.createdAt.toISOString(),
      dateLabel: format(n.createdAt, "dd 'de' MMM '·' HH:mm", { locale: ptBR }),
    }));

    return NextResponse.json({ ok: true, notes: formattedNotes });
  } catch (error) {
    console.error("TeamNote GET Error:", error);
    return NextResponse.json({ ok: false, error: "Erro ao buscar notas da equipe." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();

  if (!body.userId || !body.content) {
    return NextResponse.json({ ok: false, error: "Dados incompletos." }, { status: 400 });
  }

  try {
    const note = await prisma.teamNote.create({
      data: {
        userId: body.userId,
        authorId: auth.session.sub,
        authorRole: body.authorRole,
        targetCategory: body.targetCategory,
        content: body.content,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedNote = {
      id: note.id,
      author: note.author.name,
      authorRole: note.authorRole,
      content: note.content,
      targetCategory: note.targetCategory,
      createdAt: note.createdAt.toISOString(),
      dateLabel: format(note.createdAt, "dd 'de' MMM '·' HH:mm", { locale: ptBR }),
    };

    return NextResponse.json({ ok: true, note: formattedNote });
  } catch (error) {
    console.error("TeamNote POST Error:", error);
    return NextResponse.json({ ok: false, error: "Erro ao salvar nota da equipe." }, { status: 500 });
  }
}
