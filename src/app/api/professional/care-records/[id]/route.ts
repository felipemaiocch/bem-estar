import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireSession } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;

  try {
    await prisma.careRecord.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao excluir registro" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession(request, "PROFESSIONAL");

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const record = await prisma.careRecord.update({
      where: { id },
      data: {
        title: body.title,
        summary: body.summary,
        delivery: body.delivery,
        nextStep: body.nextStep || "",
      },
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao atualizar registro" }, { status: 500 });
  }
}
