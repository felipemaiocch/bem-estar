import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { listCareRecordsForPatient } from "@/lib/care-records";
import { prisma } from "@/lib/prisma";

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
    const record = await prisma.careRecord.findUnique({
      where: { id },
      select: { professionalUserId: true },
    });

    if (!record || record.professionalUserId !== auth.session.sub) {
      return NextResponse.json({ ok: false, error: "Registro não encontrado." }, { status: 404 });
    }

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
    const current = await prisma.careRecord.findUnique({
      where: { id },
      select: { userId: true, professionalUserId: true },
    });

    if (!current || current.professionalUserId !== auth.session.sub) {
      return NextResponse.json({ ok: false, error: "Registro não encontrado." }, { status: 404 });
    }

    await prisma.careRecord.update({
      where: { id },
      data: {
        title: body.title,
        summary: body.summary,
        delivery: body.delivery,
        nextStep: body.nextStep || "",
        sourceType: body.sourceType ?? undefined,
        sourceId: body.sourceId ?? undefined,
        visibility: body.visibility ?? undefined,
        priority: body.priority ?? undefined,
        requiresFollowUp: body.requiresFollowUp ?? undefined,
        followUpStatus: body.followUpStatus ?? undefined,
      },
    });

    const records = await listCareRecordsForPatient(auth.session.sub, current.userId);
    const record = records.find((item) => item.id === id);

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao atualizar registro" }, { status: 500 });
  }
}
