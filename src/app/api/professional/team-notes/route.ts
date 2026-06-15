import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const createTeamNoteSchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(2).max(3000),
  targetCategory: z.string().nullable().optional(),
  targetProfessionalId: z.string().nullable().optional(),
  authorRole: z.string().nullable().optional(),
  priority: z.enum(["low", "normal", "attention", "critical"]).default("normal"),
});

const updateTeamNoteSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "in_progress", "resolved"]),
});

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
          select: { name: true },
        },
        targetProfessional: {
          select: { name: true },
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
      targetProfessionalName: n.targetProfessional?.name,
      priority: n.priority,
      status: n.status,
      createdAt: n.createdAt.toISOString(),
      dateLabel: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(n.createdAt).replace(".", ""),
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

  const parsed = createTeamNoteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const note = await prisma.teamNote.create({
      data: {
        userId: parsed.data.userId,
        authorId: auth.session.sub,
        authorRole: parsed.data.authorRole,
        targetCategory: parsed.data.targetCategory,
        targetProfessionalId: parsed.data.targetProfessionalId || null,
        priority: parsed.data.priority,
        content: parsed.data.content,
      },
      include: {
        author: {
          select: { name: true },
        },
        targetProfessional: {
          select: { name: true },
        },
      },
    });

    const formattedNote = {
      id: note.id,
      author: note.author.name,
      authorRole: note.authorRole,
      content: note.content,
      targetCategory: note.targetCategory,
      targetProfessionalName: note.targetProfessional?.name,
      priority: note.priority,
      status: note.status,
      createdAt: note.createdAt.toISOString(),
      dateLabel: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(note.createdAt).replace(".", ""),
    };

    return NextResponse.json({ ok: true, note: formattedNote });
  } catch (error) {
    console.error("TeamNote POST Error:", error);
    return NextResponse.json({ ok: false, error: "Erro ao salvar nota da equipe." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const parsed = updateTeamNoteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const note = await prisma.teamNote.findUnique({
      where: { id: parsed.data.id },
      select: {
        id: true,
        userId: true,
        authorId: true,
        targetProfessionalId: true,
      },
    });

    if (!note) {
      return NextResponse.json({ ok: false, error: "Nota não encontrada." }, { status: 404 });
    }

    const canUpdate =
      note.authorId === auth.session.sub ||
      note.targetProfessionalId === auth.session.sub ||
      note.targetProfessionalId === null;

    if (!canUpdate) {
      return NextResponse.json({ ok: false, error: "Sem permissão para atualizar esta nota." }, { status: 403 });
    }

    const updated = await prisma.teamNote.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ ok: true, note: updated });
  } catch (error) {
    console.error("TeamNote PATCH Error:", error);
    return NextResponse.json({ ok: false, error: "Erro ao atualizar nota da equipe." }, { status: 500 });
  }
}
