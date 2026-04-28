import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request, "USER");

  if (auth.response) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validar tamanho (max 2MB para não sobrecarregar o DB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Imagem muito grande (máx 2MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const avatarUrl = `data:${file.type};base64,${base64}`;

    // Salvar no banco
    await prisma.user.update({
      where: { id: auth.session.sub },
      data: { avatarUrl }
    });

    return NextResponse.json({
      ok: true,
      avatarUrl
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ ok: false, error: "Erro ao processar imagem (Base64)" }, { status: 500 });
  }
}
