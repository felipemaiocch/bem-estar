import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(request, "ADMIN");

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  try {
    await prisma.engagementCard.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Falha ao excluir o card." },
      { status: 500 },
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(request, "ADMIN");
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();

  try {
    const updated = await prisma.engagementCard.update({
      where: { id },
      data: {
        category: body.category,
        title: body.title,
        date: body.date,
        location: body.location,
        status: body.status,
        points: Number(body.points),
        imageUrl: body.imageUrl || null,
        responsibleName: body.responsibleName || null,
        responsibleId: body.responsibleId || null,
        slots: body.slots || null,
        availableDays: body.availableDays || null,
      },
    });

    return NextResponse.json({ ok: true, card: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Falha ao atualizar o card." },
      { status: 500 },
    );
  }
}
