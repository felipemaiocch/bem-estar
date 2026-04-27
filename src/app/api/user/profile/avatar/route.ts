import { NextResponse, type NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar nome único
    const filename = `${auth.session.sub}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const path = join(process.cwd(), "public", "uploads", filename);

    await writeFile(path, buffer);
    const avatarUrl = `/uploads/${filename}`;

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
    return NextResponse.json({ ok: false, error: "Erro ao processar imagem" }, { status: 500 });
  }
}
