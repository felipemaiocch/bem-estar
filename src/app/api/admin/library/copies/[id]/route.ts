import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

const updateCopySchema = z.object({
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "DISCARDED"]),
  discardReason: z.string().max(500).optional(),
});

function getCopyId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminPermission(request, "LIBRARY");

  if (auth.response) {
    return auth.response;
  }

  const copyId = getCopyId(request.nextUrl.pathname);
  const body = await request.json();
  const parsed = updateCopySchema.safeParse(body);

  if (!copyId || !parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos para atualizar exemplar.", issues: parsed.success ? undefined : parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.status === "DISCARDED" && !parsed.data.discardReason?.trim()) {
    return NextResponse.json({ ok: false, error: "Informe o motivo do descarte." }, { status: 400 });
  }

  try {
    const copy = await prisma.$transaction(async (tx) => {
      const current = await tx.libraryCopy.findUnique({
        where: { id: copyId },
        select: { id: true, itemId: true, status: true },
      });

      if (!current) throw new Error("Exemplar não encontrado.");

      if (["RESERVED", "BORROWED"].includes(current.status)) {
        throw new Error("Exemplares reservados ou emprestados não podem ser descartados.");
      }

      const updated = await tx.libraryCopy.update({
        where: { id: copyId },
        data: {
          status: parsed.data.status,
          discardReason: parsed.data.status === "DISCARDED" ? parsed.data.discardReason?.trim() : null,
          discardedAt: parsed.data.status === "DISCARDED" ? new Date() : null,
        },
      });

      const availableCopies = await tx.libraryCopy.count({
        where: { itemId: current.itemId, status: "AVAILABLE" },
      });

      await tx.libraryItem.update({
        where: { id: current.itemId },
        data: { availableCopies },
      });

      return updated;
    });

    return NextResponse.json({ ok: true, copy });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Não foi possível atualizar exemplar." },
      { status: 409 },
    );
  }
}
